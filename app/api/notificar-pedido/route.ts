import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const correosSucursales: Record<string, string[]> = {
  Picarte: ["jp.marin@ferpromaq.cl"],

  Collico: ["makarena@ferpromaq.cl"],

  "Las Ánimas": ["jp.marin@ferpromaq.cl"],
};

// Correos adicionales SIEMPRE
const correosAdicionales = [
  "jp.marin@ferpromaq.cl",
  // agrega más aquí después
];

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      pedidoId,
      sucursal,
      usuario,
      prioridadAlta,
    } = body;

    // Obtener correos de TODAS las otras sucursales
    const destinatarios = Object.entries(
      correosSucursales
    )
      .filter(([nombreSucursal]) => nombreSucursal !== sucursal)
      .flatMap(([, correos]) => correos);

    // Agregar correos adicionales
    const correosFinales = [
      ...destinatarios,
      ...correosAdicionales,
    ];

    // Eliminar duplicados
    const correosUnicos = [...new Set(correosFinales)];

    await resend.emails.send({
      from: "Ferpromaq Pedidos <onboarding@resend.dev>",

      to: correosUnicos,

      subject: `Nuevo pedido #${pedidoId}`,

      html: `
        <div style="font-family: Arial, sans-serif; padding: 10px;">
          <h2 style="color:#2563eb;">
            📦 Nuevo pedido creado
          </h2>

          <p>
            <strong>Pedido:</strong>
            #${pedidoId}
          </p>

          <p>
            <strong>Sucursal:</strong>
            ${sucursal}
          </p>

          <p>
            <strong>Solicitante:</strong>
            ${usuario}
          </p>

          <p>
            <strong>Prioridad:</strong>
            ${
              prioridadAlta
                ? "⚠️ PRIORIDAD ALTA"
                : "Normal"
            }
          </p>
        </div>
      `,
    });

    return Response.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        ok: false,
      },
      {
        status: 500,
      }
    );
  }
}