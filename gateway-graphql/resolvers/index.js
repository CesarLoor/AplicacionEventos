const axios = require('axios');

const resolvers = {
  Query: {
    usuarios: async () => {
      const { data } = await axios.get('http://localhost:3001/api/usuarios');
      return data;
    },
    usuario: async (_, { id }) => {
      const { data } = await axios.get(`http://localhost:3001/api/usuarios/${id}`);
      return data;
    },
    eventos: async () => {
      const { data } = await axios.get('http://localhost:3002/api/eventos');
      return data;
    },
    evento: async (_, { id }) => {
      const { data } = await axios.get(`http://localhost:3002/api/eventos/${id}`);
      return data;
    },
    localidades: async () => {
      const { data } = await axios.get('http://localhost:3003/api/localidades');
      return data;
    },
    localidad: async (_, { id }) => {
      const { data } = await axios.get(`http://localhost:3003/api/localidades/${id}`);
      return data;
    },
  },
  Mutation: {
    registerUser: async (_, args) => {
      const { data } = await axios.post('http://localhost:3001/api/usuarios/registro', args);
      return data;
    },
    loginUser: async (_, args) => {
      const { data } = await axios.post('http://localhost:3001/api/usuarios/login', args);
      return data;
    },
    createEvent: async (_, args, context) => {
      // Pasar token si está presente (opcional)
      let headers = {};
      if (context && context.token) {
        headers.Authorization = `Bearer ${context.token}`;
      }
      const { data } = await axios.post('http://localhost:3002/api/eventos', args, { headers });
      return data;
    },
    createLocalidad: async (_, args, context) => {
      // Pasar token si está presente (opcional)
      let headers = {};
      if (context && context.token) {
        headers.Authorization = `Bearer ${context.token}`;
      }
      const { data } = await axios.post('http://localhost:3003/api/localidades', args, { headers });
      return data;
    }
  }
};

module.exports = resolvers;
