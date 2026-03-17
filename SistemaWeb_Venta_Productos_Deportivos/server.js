// server.js - Backend para FitStore
// PASO 1: Instalar dependencias primero con:
// npm install express mongoose cors dotenv

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ========== MIDDLEWARE ==========
app.use(cors()); // Permite que el frontend se conecte
app.use(express.json()); // Para leer JSON en las peticiones

// ========== CONEXIÓN A MONGODB ==========
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://fitstore_admin:FitStore2024!@cluster0.xxxxx.mongodb.net/fitstore_db?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado exitosamente'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// ========== ESQUEMAS DE MONGOOSE ==========

// Esquema de Producto
const ProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  categoria: String,
  marca: String,
  descripcion: String,
  presentaciones: [{
    sabor: String,
    color: String,
    tamaño: String,
    talla: String,
    stock: Number
  }],
  valorNutricional: {
    porcionGramos: Number,
    calorias: Number,
    proteinas: Number,
    carbohidratos: Number,
    grasas: Number,
    creatina: Number,
    leucina: Number,
    isoleucina: Number,
    valina: Number,
    cafeina: Number,
    betaAlanina: Number
  },
  imagenUrl: String,
  fechaCreacion: { type: Date, default: Date.now },
  activo: { type: Boolean, default: true },
  reseñas: [{
    usuarioNombre: String,
    calificacion: Number,
    comentario: String,
    fecha: { type: Date, default: Date.now }
  }]
}, { collection: 'productos' });

// Esquema de Usuario
const UsuarioSchema = new mongoose.Schema({
  nombreCompleto: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: String,
  preferencias: [String],
  fechaRegistro: { type: Date, default: Date.now },
  activo: { type: Boolean, default: true }
}, { collection: 'usuarios' });

// Esquema de Carrito
const CarritoSchema = new mongoose.Schema({
  usuarioId: String,
  items: [{
    productoId: mongoose.Schema.Types.ObjectId,
    nombreProducto: String,
    cantidad: Number,
    precioUnitario: Number
  }],
  fechaCreacion: { type: Date, default: Date.now },
  activo: { type: Boolean, default: true }
}, { collection: 'carritos' });

// Esquema de Compra
const CompraSchema = new mongoose.Schema({
  usuarioId: String,
  productos: [{
    productoId: mongoose.Schema.Types.ObjectId,
    nombreProducto: String,
    cantidad: Number,
    precioUnitario: Number
  }],
  subtotal: Number,
  iva: Number,
  total: Number,
  fechaCompra: { type: Date, default: Date.now },
  estado: { type: String, default: 'completada' }
}, { collection: 'compras' });

// ========== MODELOS ==========
const Producto = mongoose.model('Producto', ProductoSchema);
const Usuario = mongoose.model('Usuario', UsuarioSchema);
const Carrito = mongoose.model('Carrito', CarritoSchema);
const Compra = mongoose.model('Compra', CompraSchema);

// ========== RUTAS DE PRODUCTOS ==========

// GET - Obtener todos los productos (con filtros opcionales)
app.get('/api/productos', async (req, res) => {
  try {
    const { categoria, marca, precioMin, precioMax, search } = req.query;
    let filtro = { activo: true };
    
    // Aplicar filtros si existen
    if (categoria) filtro.categoria = categoria;
    if (marca) filtro.marca = marca;
    if (search) {
      filtro.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } }
      ];
    }
    if (precioMin || precioMax) {
      filtro.precio = {};
      if (precioMin) filtro.precio.$gte = Number(precioMin);
      if (precioMax) filtro.precio.$lte = Number(precioMax);
    }
    
    const productos = await Producto.find(filtro).sort({ fechaCreacion: -1 });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos', detalle: error.message });
  }
});

// GET - Obtener un producto por ID
app.get('/api/productos/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producto', detalle: error.message });
  }
});

// POST - Crear nuevo producto (ADMIN)
app.post('/api/productos', async (req, res) => {
  try {
    const nuevoProducto = new Producto(req.body);
    await nuevoProducto.save();
    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear producto', detalle: error.message });
  }
});

// PUT - Actualizar producto (ADMIN)
app.put('/api/productos/:id', async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar producto', detalle: error.message });
  }
});

// DELETE - Eliminar producto (soft delete - solo marca como inactivo)
app.delete('/api/productos/:id', async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ mensaje: 'Producto eliminado correctamente', producto });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto', detalle: error.message });
  }
});

// POST - Agregar reseña a un producto
app.post('/api/productos/:id/resenas', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    producto.reseñas.push({
      usuarioNombre: req.body.usuarioNombre,
      calificacion: req.body.calificacion,
      comentario: req.body.comentario,
      fecha: new Date()
    });
    
    await producto.save();
    res.json(producto);
  } catch (error) {
    res.status(400).json({ error: 'Error al agregar reseña', detalle: error.message });
  }
});

// ========== RUTAS DE USUARIOS ==========

// POST - Registrar nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  try {
    const nuevoUsuario = new Usuario(req.body);
    await nuevoUsuario.save();
    res.status(201).json(nuevoUsuario);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    res.status(400).json({ error: 'Error al registrar usuario', detalle: error.message });
  }
});

// GET - Obtener usuario por email
app.get('/api/usuarios/:email', async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ email: req.params.email, activo: true });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario', detalle: error.message });
  }
});

// GET - Obtener todos los usuarios (ADMIN)
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find({ activo: true }).select('-password');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios', detalle: error.message });
  }
});

// ========== RUTAS DE CARRITO ==========

// GET - Obtener carrito por usuario
app.get('/api/carrito/:usuarioId', async (req, res) => {
  try {
    const carrito = await Carrito.findOne({ 
      usuarioId: req.params.usuarioId,
      activo: true 
    });
    res.json(carrito || { items: [] });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener carrito', detalle: error.message });
  }
});

// POST - Agregar producto al carrito
app.post('/api/carrito', async (req, res) => {
  try {
    const { usuarioId, productoId, nombreProducto, cantidad, precioUnitario } = req.body;
    
    let carrito = await Carrito.findOne({ usuarioId, activo: true });
    
    if (!carrito) {
      carrito = new Carrito({ usuarioId, items: [] });
    }
    
    // Verificar si el producto ya está en el carrito
    const itemExistente = carrito.items.find(
      item => item.productoId.toString() === productoId
    );
    
    if (itemExistente) {
      itemExistente.cantidad += cantidad;
    } else {
      carrito.items.push({ 
        productoId, 
        nombreProducto,
        cantidad, 
        precioUnitario 
      });
    }
    
    await carrito.save();
    res.json(carrito);
  } catch (error) {
    res.status(400).json({ error: 'Error al agregar al carrito', detalle: error.message });
  }
});

// PUT - Actualizar cantidad de un producto en el carrito
app.put('/api/carrito/:usuarioId/:productoId', async (req, res) => {
  try {
    const { usuarioId, productoId } = req.params;
    const { cantidad } = req.body;
    
    const carrito = await Carrito.findOne({ usuarioId, activo: true });
    if (!carrito) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }
    
    const item = carrito.items.find(
      i => i.productoId.toString() === productoId
    );
    
    if (item) {
      item.cantidad = cantidad;
      await carrito.save();
    }
    
    res.json(carrito);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar carrito', detalle: error.message });
  }
});

// DELETE - Eliminar producto del carrito
app.delete('/api/carrito/:usuarioId/:productoId', async (req, res) => {
  try {
    const { usuarioId, productoId } = req.params;
    
    const carrito = await Carrito.findOne({ usuarioId, activo: true });
    if (!carrito) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }
    
    carrito.items = carrito.items.filter(
      item => item.productoId.toString() !== productoId
    );
    
    await carrito.save();
    res.json(carrito);
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar del carrito', detalle: error.message });
  }
});

// DELETE - Vaciar carrito completo
app.delete('/api/carrito/:usuarioId', async (req, res) => {
  try {
    await Carrito.findOneAndUpdate(
      { usuarioId: req.params.usuarioId, activo: true },
      { activo: false }
    );
    res.json({ mensaje: 'Carrito vaciado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al vaciar carrito', detalle: error.message });
  }
});

// ========== RUTAS DE COMPRAS ==========

// POST - Crear una nueva compra
app.post('/api/compras', async (req, res) => {
  try {
    const nuevaCompra = new Compra(req.body);
    await nuevaCompra.save();
    
    // Marcar el carrito como inactivo después de la compra
    await Carrito.findOneAndUpdate(
      { usuarioId: req.body.usuarioId, activo: true },
      { activo: false }
    );
    
    res.status(201).json(nuevaCompra);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear compra', detalle: error.message });
  }
});

// GET - Obtener historial de compras de un usuario
app.get('/api/compras/:usuarioId', async (req, res) => {
  try {
    const compras = await Compra.find({ 
      usuarioId: req.params.usuarioId 
    }).sort({ fechaCompra: -1 });
    res.json(compras);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener compras', detalle: error.message });
  }
});

// GET - Obtener todas las compras (ADMIN)
app.get('/api/compras', async (req, res) => {
  try {
    const compras = await Compra.find().sort({ fechaCompra: -1 });
    res.json(compras);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener compras', detalle: error.message });
  }
});

// GET - Obtener detalle de una compra
app.get('/api/compras/detalle/:id', async (req, res) => {
  try {
    const compra = await Compra.findById(req.params.id);
    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }
    res.json(compra);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener detalle de compra', detalle: error.message });
  }
});

// ========== RUTAS DE ESTADÍSTICAS (ADMIN) ==========

// GET - Resumen de estadísticas generales
app.get('/api/admin/estadisticas', async (req, res) => {
  try {
    const totalProductos = await Producto.countDocuments({ activo: true });
    const totalUsuarios = await Usuario.countDocuments({ activo: true });
    const totalCompras = await Compra.countDocuments();
    
    const ventasTotales = await Compra.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    const productosMasVendidos = await Compra.aggregate([
      { $unwind: '$productos' },
      { $group: { 
        _id: '$productos.nombreProducto', 
        cantidad: { $sum: '$productos.cantidad' },
        ingresos: { $sum: { $multiply: ['$productos.cantidad', '$productos.precioUnitario'] } }
      }},
      { $sort: { cantidad: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      totalProductos,
      totalUsuarios,
      totalCompras,
      ventasTotales: ventasTotales[0]?.total || 0,
      productosMasVendidos
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas', detalle: error.message });
  }
});

// GET - Ventas por categoría
app.get('/api/admin/ventas-categoria', async (req, res) => {
  try {
    // Esta query requiere hacer join con productos, simplificada:
    const productos = await Producto.find({ activo: true });
    const categorias = {};
    
    productos.forEach(p => {
      if (!categorias[p.categoria]) {
        categorias[p.categoria] = 0;
      }
      categorias[p.categoria]++;
    });
    
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ventas por categoría', detalle: error.message });
  }
});

// ========== RUTA DE PRUEBA ==========
app.get('/', (req, res) => {
  res.json({ 
    mensaje: '✅ API FitStore funcionando correctamente',
    endpoints: {
      productos: '/api/productos',
      usuarios: '/api/usuarios',
      carrito: '/api/carrito/:usuarioId',
      compras: '/api/compras/:usuarioId',
      admin: '/api/admin/estadisticas'
    }
  });
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);
});