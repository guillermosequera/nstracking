import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getAuthClient } from '@/utils/googleAuth';
import { Readable } from 'stream';
import { addJobWithFile, addJobWithoutFile } from '@/utils/fileJobUtils';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { getUserRole } from "@/config/roles";
import path from 'path';

export async function POST(request) {
  console.log('Iniciando solicitud POST para carga de archivo o creación de trabajo');

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

    if (!jobNumber || !deliveryDate) {
      console.log('Falta información requerida: número de trabajo o fecha de entrega');
      return NextResponse.json({ error: 'Missing required information' }, { status: 400 });
    }

    let fileLink = null;

    if (file) {
      console.log('Se recibió un archivo, procesando...');
      const auth = await getAuthClient();
      const drive = google.drive({ version: 'v3', auth });

      const originalExtension = path.extname(file.name);
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
      fileLink = driveResponse.data.webViewLink;
    } else {
      console.log('No se recibió ningún archivo, continuando sin subir archivo');
    }

    let newJob;
    if (fileLink) {
      console.log(`Agregando trabajo ${jobNumber} con archivo para el usuario ${userEmail}`);
      newJob = await addJobWithFile(
        { jobNumber, deliveryDate, lenswareNumber, fileLink },
        userEmail,
        userRole,
        activePage
      );
    } else {
      console.log(`Agregando trabajo ${jobNumber} sin archivo para el usuario ${userEmail}`);
      newJob = await addJobWithoutFile(
        { jobNumber, deliveryDate, lenswareNumber },
        userEmail,
        userRole,
        activePage
      );
    }

    console.log('Trabajo agregado con éxito');
    return NextResponse.json({ fileLink, newJob });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return NextResponse.json(
      { error: 'Error processing request', details: error.message },
      { status: 500 }
    );
  }
}