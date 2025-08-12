const { gql } = require('apollo-server');

const typeDefs = gql`
  type Usuario {
    id: ID
    nombre: String
    email: String
    rol: String
  }

  type Evento {
    id: ID
    titulo: String
    descripcion: String
    fechaHoraInicio: String
    fechaHoraFin: String
    localidadId: String
    precioEntrada: Float
    capacidadMaxima: Int
    categoria: String
    estado: String
    organizadorId: String
  }

  type Localidad {
    id: ID
    nombre: String
    direccion: String
    ciudad: String
    pais: String
    capacidadMaxima: Int
    descripcion: String
  }

  type AuthPayload {
    token: String
    usuario: Usuario
    expiraEn: Int
  }

  type Query {
    usuarios: [Usuario]
    eventos: [Evento]
    localidades: [Localidad]
    evento(id: ID!): Evento
    usuario(id: ID!): Usuario
    localidad(id: ID!): Localidad
  }

  type Mutation {
    registerUser(nombre: String!, email: String!, password: String!, confirmarPassword: String!): Usuario
    loginUser(email: String!, password: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload
    createEvent(titulo: String!, descripcion: String!, fechaHoraInicio: String!, fechaHoraFin: String!, localidadId: String!, precioEntrada: Float!, capacidadMaxima: Int!, categoria: String!): Evento
    createLocalidad(nombre: String!, direccion: String!, ciudad: String!, pais: String!, capacidadMaxima: Int!, descripcion: String): Localidad
  }
`;


module.exports = typeDefs;
