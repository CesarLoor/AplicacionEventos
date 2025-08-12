const axios = require("axios");

const resolvers = {
  Query: {
    usuarios: async () => {
      try {
        const { data } = await axios.get("http://servicio-usuarios:3001/api/usuarios");
        return data;
      } catch (error) {
        console.error("❌ Error al obtener usuarios:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.mensaje || "Error al obtener usuarios");
      }
    },
    eventos: async () => {
      try {
        const { data } = await axios.get("http://servicio-eventos:3002/api/eventos");
        return data;
      } catch (error) {
        console.error("❌ Error al obtener eventos:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.mensaje || "Error al obtener eventos");
      }
    },
    localidades: async () => {
      try {
        const { data } = await axios.get("http://servicio-localidades:3003/api/localidades");
        return data;
      } catch (error) {
        console.error("❌ Error al obtener localidades:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.mensaje || "Error al obtener localidades");
      }
    },
    usuario: async (_, { id }) => {
      try {
        const { data } = await axios.get(`http://servicio-usuarios:3001/api/usuarios/${id}`);
        return data;
      } catch (error) {
        console.error("❌ Error al obtener usuario por ID:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.mensaje || "Usuario no encontrado");
      }
    },
    evento: async (_, { id }) => {
      try {
        const { data } = await axios.get(`http://servicio-eventos:3002/api/eventos/${id}`);
        return data;
      } catch (error) {
        console.error("❌ Error al obtener evento por ID:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.mensaje || "Evento no encontrado");
      }
    },
    localidad: async (_, { id }) => {
      try {
        const { data } = await axios.get(`http://servicio-localidades:3003/api/localidades/${id}`);
        return data;
      } catch (error) {
        console.error("❌ Error al obtener localidad por ID:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.mensaje || "Localidad no encontrada");
      }
    },
  },

  Mutation: {
    registerUser: async (_, args) => {
      try {
        const { data } = await axios.post("http://servicio-usuarios:3001/api/usuarios/registro", args);
        return {
          id: data.id,
          nombre: data.nombre,
          email: data.email,
        };
      } catch (error) {
        console.error("❌ Error en registerUser:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.mensaje || "Error interno al registrar usuario");
      }
    },

    createEvent: async (_, args) => {
      try {
        const { data } = await axios.post("http://servicio-eventos:3002/api/eventos", args);
        return data;
      } catch (error) {
        console.error("❌ Error en createEvent:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.mensaje || "Error interno al crear evento");
      }
    },

    createLocalidad: async (_, args) => {
      try {
        const { data } = await axios.post("http://servicio-localidades:3003/api/localidades", args);
        return data;
      } catch (error) {
        console.error("❌ Error en createLocalidad:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.mensaje || "Error interno al crear localidad");
      }
    },

    loginUser: async (_, { email, password }) => {
      try {
        const { data } = await axios.post("http://servicio-usuarios:3001/api/usuarios/login", {
          email,
          password
        });
        return {
          token: data.token,
          usuario: data.usuario,
          expiraEn: data.expiraEn || 3600
        };
      } catch (error) {
        console.error("❌ Error en loginUser:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.mensaje || "Error de autenticación");
      }
    },

    login: async (_, { email, password }) => {
      try {
        const { data } = await axios.post("http://servicio-usuarios:3001/api/usuarios/login", {
          email,
          password
        });
        return {
          token: data.token,
          usuario: data.usuario,
          expiraEn: data.expiraEn || 3600
        };
      } catch (error) {
        console.error("❌ Error en login:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.mensaje || "Error de autenticación");
      }
    },
  },
};

module.exports = resolvers;
