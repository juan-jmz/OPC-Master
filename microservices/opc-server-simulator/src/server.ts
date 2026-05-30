import {
  OPCUAServer,
  Variant,
  DataType,
  StatusCodes,
} from "node-opcua";

class OPCServerSimulator {
  private server: OPCUAServer;
  private port: number = 4840;

  // Variables simuladas
  private temperature: number = 20.0;
  private pressure: number = 101.3;
  private isRunning: boolean = false;
  private counter: number = 0;
  private status: string = "IDLE";

  constructor() {
    this.server = new OPCUAServer({
      port: this.port,
      resourcePath: "/UA/SimulatedServer",
      buildInfo: {
        productName: "Servidor OPC Simulado",
        buildNumber: "1.0.0",
        buildDate: new Date()
      }
    });
  }

  async initialize(): Promise<void> {
    console.log("Inicializando servidor OPC...");

    await this.server.initialize();

    // Crear namespace personalizado
    const addressSpace = this.server.engine.addressSpace!;
    const namespace = addressSpace.getOwnNamespace();

    // Crear carpeta para las variables
    const device = namespace.addObject({
      organizedBy: addressSpace.rootFolder.objects,
      browseName: "SimulatedDevice"
    });

    // Variable 1: Temperatura (Double)
    const temperatureNode = namespace.addVariable({
      componentOf: device,
      browseName: "Temperature",
      dataType: "Double",
      value: {
        get: () => {
          return new Variant({
            dataType: DataType.Double,
            value: this.temperature
          });
        }
      }
    });

    // Variable 2: Presión (Float)
    namespace.addVariable({
      componentOf: device,
      browseName: "Pressure",
      dataType: "Float",
      value: {
        get: () => {
          return new Variant({
            dataType: DataType.Float,
            value: this.pressure
          });
        }
      }
    });

    // Variable 3: Estado de Máquina (Boolean)
    namespace.addVariable({
      componentOf: device,
      browseName: "IsRunning",
      dataType: "Boolean",
      value: {
        get: () => {
          return new Variant({
            dataType: DataType.Boolean,
            value: this.isRunning
          });
        },
        set: (variant: Variant) => {
          this.isRunning = variant.value;
          console.log(`⚙️ IsRunning cambiado a: ${this.isRunning}`);
          return StatusCodes.Good;
        }
      }
    });

    // Variable 4: Contador (Int32)
    namespace.addVariable({
      componentOf: device,
      browseName: "Counter",
      dataType: "Int32",
      value: {
        get: () => {
          return new Variant({
            dataType: DataType.Int32,
            value: this.counter
          });
        }
      }
    });

    // Variable 5: Estado (String)
    namespace.addVariable({
      componentOf: device,
      browseName: "Status",
      dataType: "String",
      value: {
        get: () => {
          return new Variant({
            dataType: DataType.String,
            value: this.status
          });
        }
      }
    });

    // Variable 6: Timestamp (DateTime)
    namespace.addVariable({
      componentOf: device,
      browseName: "LastUpdate",
      dataType: "DateTime",
      value: {
        get: () => {
          return new Variant({
            dataType: DataType.DateTime,
            value: new Date()
          });
        }
      }
    });

    console.log("Variables creadas exitosamente");
  }

  async start(): Promise<void> {
    await this.server.start();
    
    console.log("¡Servidor OPC UA iniciado!");
    console.log(`Endpoint: opc.tcp://localhost:${this.port}/UA/SimulatedServer`);
    console.log("Puedes conectarte con cualquier cliente OPC UA");

    // Iniciar simulación de datos
    this.startSimulation();
  }

  private startSimulation(): void {
    setInterval(() => {
      // Simular cambios en temperatura (20°C ± 5°C)
      this.temperature = 20 + (Math.random() - 0.5) * 10;
      
      // Simular cambios en presión (101.3 kPa ± 2 kPa)
      this.pressure = 101.3 + (Math.random() - 0.5) * 4;
      
      // Incrementar contador
      this.counter++;
      
      // Cambiar estado cada 10 segundos
      if (this.counter % 10 === 0) {
        this.isRunning = !this.isRunning;
        this.status = this.isRunning ? "RUNNING" : "STOPPED";
      }

      // Mostrar valores actuales
      console.log(`Temp: ${this.temperature.toFixed(2)}°C | Presión: ${this.pressure.toFixed(2)} kPa | Counter: ${this.counter} | Running: ${this.isRunning}`);
    }, 1000); // Actualizar cada segundo
  }

  async stop(): Promise<void> {
    await this.server.shutdown();
    console.log("Servidor detenido");
  }
}

// Ejecutar servidor
const simulator = new OPCServerSimulator();

simulator.initialize()
  .then(() => simulator.start())
  .catch((error) => {
    console.error("Error al iniciar servidor:", error);
    process.exit(1);
  });

// Manejo de cierre graceful
process.on("SIGINT", async () => {
  console.log("Cerrando servidor...");
  await simulator.stop();
  process.exit(0);
});

// Manejo de señales para Docker
process.on("SIGTERM", async () => {
        console.log("SIGTERM recibido, cerrando servidor...");
        await simulator.stop();
        process.exit(0);
});

process.on("SIGINT", async () => {
        console.log("SIGINT recibido, cerrando servidor...");
        await simulator.stop();
        process.exit(0);
});

// Log de inicio
console.log("Servidor OPC corriendo en contenedor Docker");
console.log(`Zona horaria: ${process.env.TZ || 'UTC'}`);