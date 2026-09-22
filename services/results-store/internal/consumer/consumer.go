package consumer

import (
	"context"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

func Start(ctx context.Context, url string) (*amqp.Connection, *amqp.Channel, <-chan amqp.Delivery) {
	log.Println("[Results Store] Connecting to RabbitMQ...")
	rabbitConn, err := amqp.Dial(url)
	if err != nil {
		log.Fatalf("[Results Store] failed to connect to RabbitMQ: %v", err)
	}

	rabbitChan, err := rabbitConn.Channel()
	if err != nil {
		rabbitConn.Close()
		log.Fatalf("[Results Store] failed to open a RabbitMQ channel: %v", err)
	}

	exchangeName := "check_events"
	if err := rabbitChan.ExchangeDeclare(exchangeName, "topic", true, false, false, false, nil); err != nil {
		rabbitChan.Close()
		rabbitConn.Close()
		log.Fatalf("[worker] failed to declare exchange: %v", err)
	}

	queueName := "results_store_log_queue"
	q, err := rabbitChan.QueueDeclare(queueName, true, false, false, false, nil)
	if err != nil {
		rabbitChan.Close()
		rabbitConn.Close()
		log.Fatalf("[Results Store] failed to declare results log queue: %v", err)
	}

	err = rabbitChan.QueueBind(q.Name, "check.completed", exchangeName, false, nil)
	if err != nil {
		rabbitChan.Close()
		rabbitConn.Close()
		log.Fatalf("[Results Store] failed to bind log queue: %v", err)
	}

	msgs, err := rabbitChan.Consume(q.Name, "", false, false, false, false, nil)
	if err != nil {
		rabbitChan.Close()
		rabbitConn.Close()
		log.Fatalf("[Results Store] failed to register consumer stream instance: %v", err)
	}

	return rabbitConn, rabbitChan, msgs
}