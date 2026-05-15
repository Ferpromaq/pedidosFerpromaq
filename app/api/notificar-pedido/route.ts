import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ==============================
// CORREOS POR SUCURSAL
// ==============================
const correosSucursales: Record<string, string[]> = {
  Picarte: ["jp.marin@ferpromaq.cl"],

  Collico: ["makarena@ferpromaq.cl"],

  "Las Ánimas": ["jp.marin@ferpromaq.cl"],
};

// ==============================
// CORREOS ADICIONALES
// ==============================
const correosAdicionales = ["jp.marin@ferpromaq.cl"];

// ==============================
// API
// ==============================
export async function POST(req: Request) {
  try {
    // ==============================
    // VALIDAR API KEY
    // ==============================
    if (!process.env.RESEND_API_KEY) {
      console.error("Falta RESEND_API_KEY");

      return Response.json(
        {
          ok: false,
          error: "Falta RESEND_API_KEY",
        },
        {
          status: 500,
        },
      );
    }

    // ==============================
    // BODY
    // ==============================
    const body = await req.json();

    const { pedidoId, sucursal, usuario, prioridadAlta } = body;

    // ==============================
    // OBTENER DESTINATARIOS
    // ==============================
    const destinatarios = Object.entries(correosSucursales)
      // NO enviar a la sucursal origen
      .filter(([nombreSucursal]) => nombreSucursal !== sucursal)
      .flatMap(([, correos]) => correos);

    // ==============================
    // COMBINAR + ELIMINAR DUPLICADOS
    // ==============================
    const correosFinales = [...destinatarios, ...correosAdicionales];

    const correosUnicos = [...new Set(correosFinales)];

    // ==============================
    // DEBUG
    // ==============================
    console.log("Correos destinatarios:", correosUnicos);

    // ==============================
    // ENVIAR EMAIL
    // ==============================
    const response = await resend.emails.send({
      from: "Ferpromaq Pedidos <notificaciones@pedidos.ferpromaq.cl>",
      // IMPORTANTE:
      // Durante pruebas usa SOLO tu correo
      // Si quieres volver a múltiples:
      // reemplaza por correosUnicos
      to: correosUnicos,

      subject: `📦 Pedido #${pedidoId} - ${sucursal}`,

      html: `
  <div style="
    font-family: Arial, sans-serif;
    background: #f4f7fb;
    padding: 20px;
  ">
    <div style="
      max-width: 600px;
      margin: auto;
      background: white;
      border-radius: 14px;
      padding: 24px;
      border: 1px solid #e5e7eb;
    ">
      <h2 style="
        margin-top: 0;
        color: #2563eb;
      ">
        📦 Nuevo pedido interno
      </h2>

      <p>
        La sucursal
        <strong>${sucursal}</strong>
        ha generado un nuevo pedido.
      </p>

      <div style="
        margin-top: 20px;
        padding: 16px;
        background: #f9fafb;
        border-radius: 10px;
      ">
        <p>
          <strong>Pedido:</strong>
          #${pedidoId}
        </p>

        <p>
          <strong>Solicitante:</strong>
          ${usuario}
        </p>

        <p>
          <strong>Sucursal:</strong>
          ${sucursal}
        </p>

        <p>
          <strong>Prioridad:</strong>
          ${prioridadAlta ? "⚠️ PRIORIDAD ALTA" : "Normal"}
        </p>
      </div>

      <!-- BOTÓN -->
      <div style="
        margin-top: 30px;
        text-align: center;
      ">
        <a
          href="https://pedidos.ferpromaq.cl/dashboard/pedidos/${pedidoId}"
          style="
            display: inline-block;
            background: #2563eb;
            color: white;
            text-decoration: none;
            padding: 14px 24px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 14px;
          "
        >
          Ver pedido
        </a>
      </div>
    </div>
  </div>
`,
    });

    // ==============================
    // LOG RESPUESTA RESEND
    // ==============================
    console.log("RESPUESTA RESEND:", response);

    // ==============================
    // VALIDAR ERROR RESEND
    // ==============================
    if (response.error) {
      console.error("ERROR RESEND:", response.error);

      return Response.json(
        {
          ok: false,
          error: response.error,
        },
        {
          status: 500,
        },
      );
    }

    // ==============================
    // OK
    // ==============================
    return Response.json({
      ok: true,
      data: response.data,
    });
  } catch (error) {
    console.error("ERROR GENERAL EMAIL:", error);

    return Response.json(
      {
        ok: false,
        error,
      },
      {
        status: 500,
      },
    );
  }
}
