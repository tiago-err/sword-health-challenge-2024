import amqp from "amqplib";

export async function sendMessage(queue: string, message: string) {
	let connection;
	try {
		connection = await amqp.connect("amqp://localhost");
		const channel = await connection.createChannel();

		await channel.assertQueue(queue, {durable: false});
		channel.sendToQueue(queue, Buffer.from(message));
		console.log("MESSAGE SENT");
		await channel.close();
	} catch (err) {
		console.warn(err);
	} finally {
		if (connection) await connection.close();
	}
}
export async function createMessageReceiver(queue: string, onReceive: (message: amqp.ConsumeMessage | null) => void) {
	try {
		const connection = await amqp.connect("amqp://localhost");
		const channel = await connection.createChannel();

		process.once("SIGINT", async () => {
			await channel.close();
			await connection.close();
		});

		await channel.assertQueue(queue, {durable: false});
		await channel.consume(queue, onReceive, {noAck: true});

		console.log(" [*] Waiting for messages. To exit press CTRL+C");
	} catch (err) {
		console.warn(err);
	}
}
