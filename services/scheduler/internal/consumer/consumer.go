package consumer

import (
	"context"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

// Start returns the connection and channel objects so main can manage their lifecycle deferrals cleanly
func Start(ctx context.Context, url string) (*amqp.Connection, *amqp.Channel, <-chan amqp.Delivery) {
	rabbitConn, err := amqp.Dial(url)
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %v", err)
	}

	rabbitChan, err := rabbitConn.Channel()
	if err != nil {
		rabbitConn.Close()
		log.Fatalf("Failed to open a RabbitMQ channel: %v", err)
	}

	log.Println("Successfully connected to RabbitMQ!")

	exchangeName := "monitor_events"
	err = rabbitChan.ExchangeDeclare(
		exchangeName, 
		"fanout",        
		true,             
		false,          
		false,          
		false,           
		nil,              
	)
	if err != nil {
		log.Fatalf("Failed to declare exchange: %v", err)
	}
	
	queueName := "go_monitor_processor_queue"
	q, err := rabbitChan.QueueDeclare(
		queueName,
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("Failed to declare a queue: %v", err)
	}

	err = rabbitChan.QueueBind(
		q.Name,
		"", // Fanout exchange ignores routing keys entirely
		exchangeName,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("Failed to bind queue: %v", err)
	} 

	msgs, err := rabbitChan.Consume(
		q.Name,
		"",
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("Failed to register a consumer: %v", err)
	}

	return rabbitConn, rabbitChan, msgs
}
