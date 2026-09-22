package consumer

import (
	"context"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

func Start(ctx context.Context, url string) (*amqp.Connection, *amqp.Channel, <-chan amqp.Delivery) {
	log.Println("[Worker] Connecting to RabbitMQ...")
	rabbitConn, err := amqp.Dial(url)
	if err != nil {
		log.Fatalf("[worker] failed to connect to RabbitMQ: %v", err)
	}

	rabbitChan, err := rabbitConn.Channel()
	if err != nil {
		rabbitConn.Close()
		log.Fatalf("[worker] failed to open a RabbitMQ channel: %v", err)
	}

	exchangeName := "check_events"
	if err := rabbitChan.ExchangeDeclare(exchangeName, "fanout", true, false, false, false, nil); err != nil {
		rabbitChan.Close()
		rabbitConn.Close()
		log.Fatalf("[worker] failed to declare exchange: %v", err)
	}

	queueName := "monitor_checks_queue"
	q, err := rabbitChan.QueueDeclare(queueName, true, false, false, false, nil)
	if err != nil {
		rabbitChan.Close()
		rabbitConn.Close()
		log.Fatalf("failed to declare a queue: %v", err)
	}

	if err := rabbitChan.QueueBind(q.Name, "", exchangeName, false, nil); err != nil {
		rabbitChan.Close()
		rabbitConn.Close()
		log.Fatalf("failed to bind queue: %v", err)
	}

	msgs, err := rabbitChan.Consume(q.Name, "", false, false, false, false, nil)
	if err != nil {
		rabbitChan.Close()
		rabbitConn.Close()
		log.Fatalf("Failed to register a consumer: %v", err)
	}

	return rabbitConn, rabbitChan, msgs
}