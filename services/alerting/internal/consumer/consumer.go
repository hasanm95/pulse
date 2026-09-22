package consumer

import (
	"context"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

func Start(ctx context.Context, url string) (*amqp.Connection, *amqp.Channel, <-chan amqp.Delivery) {
	log.Println("[Alerting] Connecting to RabbitMQ...")
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
	queueName := "alerting_processor_queue"

	if err := rabbitChan.ExchangeDeclare(exchangeName, "fanout", true, false, false, false, nil); err != nil {
		rabbitChan.Close()
		rabbitConn.Close()
		log.Fatalf("[Alerting] Failed to declare check_events exchange: %v", err)
	}

	q, err := rabbitChan.QueueDeclare(queueName, true, false, false, false, nil)
	if err != nil {
		rabbitChan.Close()
		rabbitConn.Close()
		log.Fatalf("[Alerting] Failed to declare alerting queue: %v", err)
	}

	err = rabbitChan.QueueBind(q.Name, "check.completed", exchangeName, false, nil)
	if err != nil {
		rabbitChan.Close()
		rabbitConn.Close()
		log.Fatalf("[Alerting] Failed to bind queue to exchange: %v", err)
	}

	msgs, err := rabbitChan.Consume(q.Name, "", false, false, false, false, nil)
	if err != nil {
		rabbitChan.Close()
		rabbitConn.Close()
		log.Fatalf("[Alerting] Failed to start consuming delivery stream: %v", err)
	}

	return rabbitConn, rabbitChan, msgs
}