const userNames = {
  'tecnico.ti@italoptic.cl': 'Guillermo S',
  'ejecutivo1@italoptic.cl': 'Claudia L',
  'ejecutivo2@italoptic.cl': 'Ali M',
  'ejecutivo3@italoptic.cl': 'Vivian E',
  'ejecutivo4@italoptic.cl': 'Carolina L',
  'superficie@italoptic.cl': 'Marisol M',
  'bodegacentral@italoptic.cl': 'Esther Z',
  'italopticmontaje@gmail.com': 'Kuendy K',
  'despacho@italoptic.cl': 'Solange',
  'asisdepachoitaloptic@gmail.com': 'Mary',
  'asisdepachoitaloptic2@gmail.com': 'Valeria',
  'conveniostrento@opticatrento.cl': 'Valeria G',
  'compras@italoptic.cl': 'Enzo T',
  'gerencia@opticatrento.cl': 'Silvano T',
  'gerencia@italoptic.cl': 'Silvano T',
  'gerentia.ti@italoptic.cl': 'Gabriel G',
  'rrhh@italoptic.cl': 'Carlos V',
  'produccion@italoptic.cl': 'Cesar',
  'trentopv@gmail.com': 'Laura C',
  'trentopv2@gmail.com': 'Jimena',
  'coordinadorcomercial@opticatrento.cl': 'Darwin B',
  'produccion@italoptic.cl': 'Matías F'

}

export function getUserName(email) {
  return userNames[email] || 'Anónimo'
} 