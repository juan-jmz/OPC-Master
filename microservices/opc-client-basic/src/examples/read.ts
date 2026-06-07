import {
    AttributeIds,
    OPCUAClient
} from "node-opcua";

const ENDPOINT =
    process.env.OPCUA_ENDPOINT ||
    "opc.tcp://localhost:4840/UA/SimulatedServer";

const NODES = [
    {
        name: "Temperature",
        nodeId: "ns=1;s=Temperature"
    },
    {
        name: "Pressure",
        nodeId: "ns=1;s=Pressure"
    },
    {
        name: "IsRunning",
        nodeId: "ns=1;s=IsRunning"
    },
    {
        name: "Counter",
        nodeId: "ns=1;s=Counter"
    },
    {
        name: "Status",
        nodeId: "ns=1;s=Status"
    },
    {
        name: "LastUpdate",
        nodeId: "ns=1;s=LastUpdate"
    }
];

async function main(): Promise<void> {

    const client = OPCUAClient.create({
        endpointMustExist: false
    });

    try {

        console.log(`Conectando a ${ENDPOINT}...\n`);

        await client.connect(ENDPOINT);

        const session = await client.createSession();

        console.log("Conectado\n");

        for (const node of NODES) {

            const dataValue = await session.read({
                nodeId: node.nodeId,
                attributeId: AttributeIds.Value
            });

            console.log(
                `${node.name}: ${dataValue.value.value}`
            );
        }

        await session.close();
        await client.disconnect();

        console.log("\nDesconectado");

    } catch (error) {

        console.error(
            "Error leyendo variables:",
            error
        );

        await client.disconnect();
    }
}

main();