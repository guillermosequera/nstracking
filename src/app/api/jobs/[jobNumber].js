export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const jobNumber = searchParams.get('jobNumber');
  const userRole = searchParams.get('userRole');
  const action = searchParams.get('action'); // Asegúrate de que el cliente envíe esta acción
  const changesSheetId = sheetIds[userRole];

  if (action !== 'delete') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  if (!jobNumber) {
    return NextResponse.json({ error: 'Job number is required' }, { status: 400 });
  }

  if (!changesSheetId) {
    return NextResponse.json({ error: 'Invalid sheet ID for role' }, { status: 400 });
  }

  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: changesSheetId,
      range: 'A:Z',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === jobNumber);

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: changesSheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });

    const timestamp = new Date().toISOString();
    const values = [[jobNumber, 'delete', userRole, timestamp]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: changesSheetId,
      range: 'CAMBIOS!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    return NextResponse.json({ message: 'Job deleted and change logged successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}