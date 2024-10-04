import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getAuthClient } from '@/utils/googleAuth';
import { Readable } from 'stream';
import { addJobWithFile } from '@/utils/fileJobUtils';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { getUserRole } from "@/config/roles";
import path from 'path';

export async function POST(request) {
  console.log('Iniciando solicitud POST para carga de archivo');

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('No se encontró sesión de usuario');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    const userRole = getUserRole(userEmail);
    console.log(`Usuario autenticado: ${userEmail}, Rol: ${userRole}`);

    const formData = await request.formData();
    const file = formData.get('file');
    const jobNumber = formData.get('jobNumber');
    const deliveryDate = formData.get('deliveryDate');
    const lenswareNumber = formData.get('lenswareNumber');
    const activePage = 'commerce';

    if (!file) {
      console.log('No se recibió ningún archivo');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('Obteniendo cliente de autenticación');
    const auth = await getAuthClient();
    console.log('Cliente de autenticación obtenido');

    const drive = google.drive({ version: 'v3', auth });

    // Obtener la extensión del archivo original
    const originalExtension = path.extname(file.name);

    // Crear un nuevo nombre de archivo que incluya el número de trabajo
    const newFileName = `${jobNumber}_${new Date().toISOString()}${originalExtension}`;

    const fileMetadata = {
      name: newFileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const buffer = await file.arrayBuffer();
    const stream = new Readable();
    stream.push(Buffer.from(buffer));
    stream.push(null);

    const media = {
      mimeType: file.type,
      body: stream,
    };

    console.log('Intentando crear archivo en Google Drive');
    const driveResponse = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    console.log('Archivo creado en Google Drive:', driveResponse.data);
    const fileLink = driveResponse.data.webViewLink;

    console.log(`Agregando trabajo ${jobNumber} con archivo para el usuario ${userEmail}`);
    const newJob = await addJobWithFile(
      { jobNumber, deliveryDate, lenswareNumber, fileLink },
      userEmail,
      userRole,
      activePage
    );

    console.log('Trabajo agregado con éxito');
    return NextResponse.json({ fileLink, newJob });
  } catch (error) {
    console.error('Error al cargar el archivo:', error);
    return NextResponse.json(
      { error: 'Error uploading file', details: error.message },
      { status: 500 }
    );
  }
}