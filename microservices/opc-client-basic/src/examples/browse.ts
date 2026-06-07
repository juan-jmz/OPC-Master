import {
    AttributeIds,
    BrowseDirection,
    ClientSession,
    NodeClass,
    OPCUAClient
} from "node-opcua";


//Definimos el endpoint del servidor OPC UA
const ENDPOINT =
    process.env.OPCUA_ENDPOINT ||
    "opc.tcp://localhost:4840/UA/SimulatedServer";

// Mapeo de DataType para mostrar nombres legibles
const DATA_TYPE_MAP: Record<number, string> = {
    1: "Boolean",
    2: "SByte",
    3: "Byte",
    4: "Int16",
    5: "UInt16",
    6: "Int32",
    7: "UInt32",
    8: "Int64",
    9: "UInt64",
    10: "Float",
    11: "Double",
    12: "String",
    13: "DateTime",
    14: "Guid",
    15: "ByteString",
    16: "XmlElement",
    17: "NodeId",
    18: "ExpandedNodeId",
    19: "StatusCode",
    20: "QualifiedName",
    21: "LocalizedText",
    22: "ExtensionObject",
    23: "DataValue",
    24: "Variant",
    25: "DiagnosticInfo"
};

// Función recursiva para explorar nodos y mostrar su información
async function browseNode(
    session: ClientSession,
    nodeId: string,
    indent: string = ""
): Promise<void> {

    const browseResult = await session.browse({
        nodeId,
        browseDirection: BrowseDirection.Forward,
        includeSubtypes: true,
        nodeClassMask: 0,
        resultMask: 63
    });

    for (const reference of browseResult.references || []) {

        const nodeClass =
            NodeClass[reference.nodeClass] || "Unknown";

        if (reference.nodeClass === NodeClass.Variable) {

            const dataTypeResult = await session.read({
                nodeId: reference.nodeId,
                attributeId: AttributeIds.DataType
            });

            const dataTypeNodeId = dataTypeResult.value.value;

            let dataTypeNumber = "Unknown";
            let dataTypeName = "Unknown";

            if (dataTypeNodeId?.value !== undefined) {
                dataTypeNumber = dataTypeNodeId.value.toString();
                dataTypeName =
                    DATA_TYPE_MAP[dataTypeNodeId.value] ??
                    "Custom Type";
            }

            console.log(
                `${indent}├─ ${reference.browseName.name} (${nodeClass}) [${reference.nodeId.toString()}]`
            );

            console.log(
                `${indent}│  DataType: ${dataTypeNumber} (${dataTypeName})`
            );

        } else {

            console.log(
                `${indent}├─ ${reference.browseName.name} (${nodeClass}) [${reference.nodeId.toString()}]`
            );
        }

        if (
            reference.nodeClass === NodeClass.Object ||
            reference.nodeClass === NodeClass.Variable
        ) {
            try {
                const children = await session.browse({
                    nodeId: reference.nodeId,
                    browseDirection: BrowseDirection.Forward,
                    includeSubtypes: true,
                    nodeClassMask: 0,
                    resultMask: 63
                });

                if (
                    children.references &&
                    children.references.length > 0
                ) {
                    await browseNode(
                        session,
                        reference.nodeId.toString(),
                        `${indent}│  `
                    );
                }
            } catch (error) {
                // Ignorar nodos sin hijos
            }
        }
    }
}

// Función principal para conectar al servidor y explorar nodos
async function main(): Promise<void> {


    // Crear cliente OPC UA
    const client = OPCUAClient.create({
        endpointMustExist: false
    });

    try {

        console.log(`Conectando a ${ENDPOINT}...\n`);

        await client.connect(ENDPOINT);

        const session = await client.createSession();

        console.log("Conectado correctamente\n");

        console.log("Explorando Objects...\n");

        // Iniciar exploración desde el nodo raíz de objetos
        await browseNode(
            session,
            "ns=0;i=85" // Nodo estándar ObjectsFolder
        );

        await session.close();
        await client.disconnect();

        console.log("\nDesconectado");

    } catch (error) {

        console.error(
            "Error durante la exploración:",
            error
        );

        await client.disconnect();
    }
}

main();