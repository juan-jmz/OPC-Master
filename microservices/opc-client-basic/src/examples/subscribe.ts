import {
    AttributeIds,
    ClientMonitoredItem,
    ClientSubscription,
    OPCUAClient,
    TimestampsToReturn
} from "node-opcua";

const ENDPOINT =
    process.env.OPCUA_ENDPOINT ||
    "opc.tcp://localhost:4840/UA/SimulatedServer";

const NODE_ID = "ns=1;s=Temperature";

async function main(): Promise<void> {

    const client = OPCUAClient.create({
        endpointMustExist: false
    });

    try {

        console.log(`Conectando a ${ENDPOINT}...\n`);

        await client.connect(ENDPOINT);

        const session = await client.createSession();

        console.log("Conectado correctamente\n");

        const subscription = ClientSubscription.create(
            session,
            {
                requestedPublishingInterval: 1000,
                requestedLifetimeCount: 100,
                requestedMaxKeepAliveCount: 10,
                maxNotificationsPerPublish: 100,
                publishingEnabled: true,
                priority: 1
            }
        );

        subscription.on("started", () => {

            console.log(
                `Subscription creada. ID: ${subscription.subscriptionId}`
            );

            console.log(
                `Monitoreando ${NODE_ID}\n`
            );
        });

        subscription.on("terminated", () => {

            console.log(
                "Subscription terminada"
            );
        });

        const monitoredItem =
            ClientMonitoredItem.create(
                subscription,
                {
                    nodeId: NODE_ID,
                    attributeId: AttributeIds.Value
                },
                {
                    samplingInterval: 1000,
                    discardOldest: true,
                    queueSize: 10
                },
                TimestampsToReturn.Both
            );

        monitoredItem.on(
            "changed",
            (dataValue) => {

                console.log(
                    `[${new Date().toISOString()}] Value: ${dataValue.value.value}`
                );

                console.log(
                    `  SourceTimestamp: ${dataValue.sourceTimestamp}`
                );

                console.log(
                    `  ServerTimestamp: ${dataValue.serverTimestamp}\n`
                );
            }
        );

        console.log(
            "Esperando cambios. Presiona Ctrl+C para salir.\n"
        );

        process.on("SIGINT", async () => {

            console.log("\nCerrando...");

            await subscription.terminate();
            await session.close();
            await client.disconnect();

            process.exit(0);
        });

    } catch (error) {

        console.error(
            "Error:",
            error
        );

        await client.disconnect();
    }
}

main();