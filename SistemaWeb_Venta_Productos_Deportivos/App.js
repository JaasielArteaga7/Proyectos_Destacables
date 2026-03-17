import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Search, Star, Plus, Minus, Trash2, Package, TrendingUp, Loader } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function FitStoreConnected() {
  const [screen, setScreen] = useState('catalog');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ categoria: '', marca: '' });

  // Cargar productos desde MongoDB
  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.categoria) params.append('categoria', filters.categoria);
      if (filters.marca) params.append('marca', filters.marca);
      
      const response = await fetch(`${API_URL}/productos?${params}`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('❌ ERROR al cargar productos:', error);
      alert('No se pudo conectar con el servidor. Asegúrate de que el backend esté corriendo en http://localhost:5000');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product) => {
    const existing = cart.find(item => item._id === product._id);
    if (existing) {
      setCart(cart.map(item => 
        item._id === product._id ? {...item, qty: item.qty + 1} : item
      ));
    } else {
      setCart([...cart, {...product, qty: 1}]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => 
      item._id === id ? {...item, qty: Math.max(1, item.qty + delta)} : item
    ));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item._id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.precio * item.qty), 0);
  const iva = total * 0.16;

  const createProduct = async (productData) => {
    try {
      const response = await fetch(`${API_URL}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      const newProduct = await response.json();
      setProducts([...products, newProduct]);
      return newProduct;
    } catch (error) {
      console.error('Error al crear producto:', error);
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const response = await fetch(`${API_URL}/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      const updated = await response.json();
      setProducts(products.map(p => p._id === id ? updated : p));
    } catch (error) {
      console.error('Error al actualizar producto:', error);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' });
      setProducts(products.filter(p => p._id !== id));
    } catch (error) {
      console.error('Error al eliminar producto:', error);
    }
  };

  // PANTALLA 1: CATÁLOGO
  const CatalogScreen = () => (
    <div className="flex h-full">
      <div className="w-64 bg-gray-50 p-4 border-r">
        <h3 className="font-bold mb-4 text-gray-700">Filtros</h3>
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-sm mb-2">Categoría</p>
            {['', 'Proteínas', 'Suplementos', 'Vitaminas', 'Ropa','Accesorios' ].map(cat => (
              <label key={cat} className="flex items-center gap-2 text-sm py-1">
                <input 
                  type="radio" 
                  name="categoria"
                  checked={filters.categoria === cat}
                  onChange={() => setFilters({...filters, categoria: cat})}
                />
                {cat || 'Todas'}
              </label>
            ))}
          </div>
          <div>
            <p className="font-semibold text-sm mb-2">Marca</p>
            {['', 'FitPro', 'MaxGain', 'HealthPlus'].map(brand => (
              <label key={brand} className="flex items-center gap-2 text-sm py-1">
                <input 
                  type="radio"
                  name="marca"
                  checked={filters.marca === brand}
                  onChange={() => setFilters({...filters, marca: brand})}
                />
                {brand || 'Todas'}
              </label>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-green-500" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {products.map(p => (
              <div key={p._id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-4">
                <div className="mb-3 h-40 flex items-center justify-center bg-gray-50 rounded overflow-hidden">
                  {p.imagenUrl && p.imagenUrl.startsWith('http') ? (
                    <img 
                      src={p.imagenUrl} 
                      alt={p.nombre} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-6xl">{p.imagenUrl || '📦'}</div>
                  )}
                </div>
                <h3 className="font-semibold text-sm mb-1 h-10 line-clamp-2">{p.nombre}</h3>
                <p className="text-xs text-gray-500 mb-2">{p.marca}</p>
                <p className="text-green-600 font-bold mb-3">${p.precio}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {setSelectedProduct(p); setScreen('detail');}}
                    className="flex-1 bg-gray-100 text-xs py-2 rounded hover:bg-gray-200"
                  >
                    Ver
                  </button>
                  <button 
                    onClick={() => addToCart(p)}
                    className="flex-1 bg-green-500 text-white text-xs py-2 rounded hover:bg-green-600"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // PANTALLA 2: DETALLE
  const DetailScreen = () => (
    <div className="p-8 overflow-auto">
      <button onClick={() => setScreen('catalog')} className="mb-4 text-sm text-gray-600 hover:text-black">
        ← Volver
      </button>
      <div className="flex gap-8">
        <div className="w-1/2">
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            {selectedProduct.imagenUrl && selectedProduct.imagenUrl.startsWith('http') ? (
              <img 
                src={selectedProduct.imagenUrl} 
                alt={selectedProduct.nombre} 
                className="w-full h-96 object-contain"
              />
            ) : (
              <div className="h-96 flex items-center justify-center text-8xl">
                {selectedProduct.imagenUrl || '📦'}
              </div>
            )}
          </div>
        </div>
        <div className="w-1/2">
          <h1 className="text-2xl font-bold mb-2">{selectedProduct.nombre}</h1>
          <p className="text-gray-600 mb-3">{selectedProduct.marca}</p>
          <p className="text-3xl text-green-600 font-bold mb-4">${selectedProduct.precio}</p>
          
          {selectedProduct.descripcion && (
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">{selectedProduct.descripcion}</p>
          )}
          
          {selectedProduct.presentaciones && selectedProduct.presentaciones.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Presentación</label>
              <select className="w-full border rounded p-2 text-sm">
                {selectedProduct.presentaciones.map((pres, i) => (
                  <option key={i}>
                    {pres.sabor || pres.color || 'Sin especificar'} - {pres.tamaño || pres.talla} (Stock: {pres.stock})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {selectedProduct.valorNutricional && (
            <div className="mb-6 bg-gray-50 rounded p-4">
              <h3 className="font-semibold text-sm mb-3">Información Nutricional</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {selectedProduct.valorNutricional.porcionGramos && (
                  <div><span className="font-medium">Porción:</span> {selectedProduct.valorNutricional.porcionGramos}g</div>
                )}
                {selectedProduct.valorNutricional.calorias && (
                  <div><span className="font-medium">Calorías:</span> {selectedProduct.valorNutricional.calorias} kcal</div>
                )}
                {selectedProduct.valorNutricional.proteinas && (
                  <div><span className="font-medium">Proteínas:</span> {selectedProduct.valorNutricional.proteinas}g</div>
                )}
                {selectedProduct.valorNutricional.carbohidratos && (
                  <div><span className="font-medium">Carbohidratos:</span> {selectedProduct.valorNutricional.carbohidratos}g</div>
                )}
                {selectedProduct.valorNutricional.grasas && (
                  <div><span className="font-medium">Grasas:</span> {selectedProduct.valorNutricional.grasas}g</div>
                )}
                {selectedProduct.valorNutricional.creatina && (
                  <div><span className="font-medium">Creatina:</span> {selectedProduct.valorNutricional.creatina}g</div>
                )}
              </div>
            </div>
          )}
          
          <button 
            onClick={() => {addToCart(selectedProduct); setScreen('catalog');}}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 mb-6"
          >
            Agregar al Carrito
          </button>
          
          {selectedProduct.reseñas && selectedProduct.reseñas.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-bold mb-4 text-lg">Reseñas de Clientes</h3>
              <div className="space-y-3">
                {selectedProduct.reseñas.map((review, i) => (
                  <div key={i} className="border-b pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {[...Array(review.calificacion)].map((_, j) => (
                          <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-sm font-semibold">{review.usuarioNombre}</span>
                    </div>
                    <p className="text-sm text-gray-600">{review.comentario}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // PANTALLA 3: CARRITO
  const CartScreen = () => (
    <div className="p-8 overflow-auto">
      <h1 className="text-3xl font-bold mb-6">Carrito de Compras</h1>
      <div className="flex gap-6">
        <div className="flex-1">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4" />
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item._id} className="flex items-center gap-4 bg-white rounded-lg shadow p-4">
                  <div className="text-4xl">{item.imagenUrl || '📦'}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.nombre}</h3>
                    <p className="text-sm text-gray-500">{item.marca}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item._id, -1)} className="p-1 hover:bg-gray-100 rounded">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item._id, 1)} className="p-1 hover:bg-gray-100 rounded">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="font-bold w-20 text-right">${item.precio * item.qty}</p>
                  <button onClick={() => removeFromCart(item._id)} className="p-2 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="w-80">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h3 className="font-bold mb-4">Resumen</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IVA (16%)</span>
                <span>${iva.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-green-600">${(total + iva).toFixed(2)}</span>
              </div>
            </div>
            <button 
              disabled={cart.length === 0}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-300"
            >
              Proceder al Pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // PANTALLA 4: REGISTRO
  const RegisterScreen = () => {
    const [formData, setFormData] = useState({
      nombreCompleto: '',
      email: '',
      password: '',
      confirmPassword: '',
      preferencias: []
    });
    const [message, setMessage] = useState('');

    const handlePreferenceChange = (pref) => {
      if (formData.preferencias.includes(pref)) {
        setFormData({
          ...formData,
          preferencias: formData.preferencias.filter(p => p !== pref)
        });
      } else {
        setFormData({
          ...formData,
          preferencias: [...formData.preferencias, pref]
        });
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (formData.password !== formData.confirmPassword) {
        setMessage('❌ Las contraseñas no coinciden');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/usuarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombreCompleto: formData.nombreCompleto,
            email: formData.email,
            password: formData.password,
            preferencias: formData.preferencias
          })
        });

        if (response.ok) {
          setMessage('✅ Cuenta creada exitosamente');
          setTimeout(() => setScreen('catalog'), 2000);
        } else {
          setMessage('❌ Error al crear cuenta');
        }
      } catch (error) {
        console.error('Error:', error);
        setMessage('❌ No se pudo conectar con el servidor');
      }
    };

    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-green-50 to-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Crear Cuenta</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="text" 
              placeholder="Nombre completo" 
              className="w-full border rounded p-2"
              value={formData.nombreCompleto}
              onChange={(e) => setFormData({...formData, nombreCompleto: e.target.value})}
              required
            />
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              className="w-full border rounded p-2"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
            <input 
              type="password" 
              placeholder="Contraseña" 
              className="w-full border rounded p-2"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            <input 
              type="password" 
              placeholder="Confirmar contraseña" 
              className="w-full border rounded p-2"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
            />
            
            <div>
              <p className="text-sm font-semibold mb-2">Preferencias</p>
              <div className="space-y-1">
                {['Proteínas', 'Creatina', 'Vitaminas', 'Ropa'].map(pref => (
                  <label key={pref} className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox"
                      checked={formData.preferencias.includes(pref)}
                      onChange={() => handlePreferenceChange(pref)}
                    />
                    {pref}
                  </label>
                ))}
              </div>
            </div>
            
            {message && (
              <div className={`text-sm text-center py-2 rounded ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message}
              </div>
            )}
            
            <button type="submit" className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 font-semibold">
              Crear Cuenta
            </button>
          </form>
        </div>
      </div>
    );
  };

  // PANTALLA 5: HISTORIAL
  const HistoryScreen = () => (
    <div className="p-8 overflow-auto">
      <h1 className="text-3xl font-bold mb-6">Historial de Compras</h1>
      <div className="space-y-4">
        {[
          { date: '15 Nov 2024', total: 1548, items: ['Proteína Whey Gold', 'BCAA 2:1:1'] },
          { date: '03 Nov 2024', total: 948, items: ['Creatina Monohidrato', 'Multivitamínico'] },
        ].map((order, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500">{order.date}</p>
                <p className="font-bold text-xl text-green-600">${order.total}</p>
              </div>
            </div>
            <div className="space-y-1">
              {order.items.map((item, j) => (
                <p key={j} className="text-sm text-gray-600">• {item}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // PANTALLA 6: ADMIN
  const AdminScreen = () => (
    <div className="flex h-full">
      <div className="w-64 bg-gray-900 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <nav className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-2 bg-green-600 rounded">
            <Package className="w-5 h-5" />
            Productos
          </button>
        </nav>
      </div>
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Productos</h1>
          <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Agregar Producto
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map(p => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <span className="text-2xl">{p.imagenUrl || '📦'}</span>
                    <span className="font-medium">{p.nombre}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">{p.categoria}</td>
                  <td className="px-6 py-4 text-sm font-semibold">${p.precio}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:underline text-sm">Editar</button>
                      <button 
                        onClick={() => deleteProduct(p._id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      <header className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setScreen('catalog')}
          >
            {/* Opción 1: Con emoji (actual) */}
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-2xl transform group-hover:scale-110 transition-transform">
              💪
            </div>
            
            {/* Opción 2: Con imagen PNG (descomenta si tienes logo.png en /public) */}
            {/* <img src="/logo.png" alt="FitStore" className="w-10 h-10 transform group-hover:scale-110 transition-transform" /> */}
            
            <div>
              <h1 className="text-2xl font-bold leading-none">FitStore</h1>
              <p className="text-xs text-green-100 uppercase tracking-wider">Fuel Your Fitness</p>
            </div>
          </div>
          
          {screen !== 'register' && screen !== 'admin' && (
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar productos..." 
                  className="w-full pl-10 pr-4 py-2 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <button onClick={() => setScreen('history')} className="hover:bg-green-700 p-2 rounded">
              <User className="w-6 h-6" />
            </button>
            <button onClick={() => setScreen('cart')} className="hover:bg-green-700 p-2 rounded relative">
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b px-6 py-2">
        <div className="flex gap-4 text-sm">
          <button onClick={() => setScreen('catalog')} className={`px-3 py-1 rounded ${screen === 'catalog' ? 'bg-green-100 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
            Catálogo
          </button>
          <button onClick={() => setScreen('cart')} className={`px-3 py-1 rounded ${screen === 'cart' ? 'bg-green-100 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
            Carrito
          </button>
          <button onClick={() => setScreen('history')} className={`px-3 py-1 rounded ${screen === 'history' ? 'bg-green-100 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
            Historial
          </button>
          <button onClick={() => setScreen('register')} className={`px-3 py-1 rounded ${screen === 'register' ? 'bg-green-100 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
            Registro
          </button>
          <button onClick={() => setScreen('admin')} className={`px-3 py-1 rounded ${screen === 'admin' ? 'bg-green-100 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
            Admin
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-hidden">
        {screen === 'catalog' && <CatalogScreen />}
        {screen === 'detail' && selectedProduct && <DetailScreen />}
        {screen === 'cart' && <CartScreen />}
        {screen === 'register' && <RegisterScreen />}
        {screen === 'history' && <HistoryScreen />}
        {screen === 'admin' && <AdminScreen />}
      </main>
    </div>
  );
}