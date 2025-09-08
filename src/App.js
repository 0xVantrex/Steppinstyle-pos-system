import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  FileText,
  Plus,
  Minus,
  Edit3,
  Trash2,
  Save,
  X,
} from "lucide-react";

const ShoePOSSystem = () => {
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem("shoeProducts");
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem("shoeSales");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentSale, setCurrentSale] = useState({
    productId: "",
    size: "",
    quantity: 1,
    paymentMethod: "Cash",
  });

  const [activeTab, setActiveTab] = useState("sale");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    productId: null,
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    sizes: {
      6: 0,
      6.5: 0,
      7: 0,
      7.5: 0,
      8: 0,
      8.5: 0,
      9: 0,
      9.5: 0,
      10: 0,
      10.5: 0,
      11: 0,
      11.5: 0,
      12: 0,
    },
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem("shoeProducts", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("shoeSales", JSON.stringify(sales));
  }, [sales]);

  // Get today's sales
  const getTodaysSales = () => {
    const today = new Date().toDateString();
    return sales.filter(
      (sale) => new Date(sale.timestamp).toDateString() === today
    );
  };

  // Add new product
  const addProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      alert("Please enter product name and price");
      return;
    }

    const product = {
      id: Date.now(),
      name: newProduct.name.trim(),
      price: parseFloat(newProduct.price),
      sizes: { ...newProduct.sizes },
      dateAdded: new Date().toISOString(),
    };

    setProducts([...products, product]);
    setNewProduct({
      name: "",
      price: "",
      sizes: {
        6: 0,
        6.5: 0,
        7: 0,
        7.5: 0,
        8: 0,
        8.5: 0,
        9: 0,
        9.5: 0,
        10: 0,
        10.5: 0,
        11: 0,
        11.5: 0,
        12: 0,
      },
    });
    setIsAddingProduct(false);
  };

  // Update product stock
  const updateProductStock = (productId, size, newQty) => {
    setProducts(
      products.map((p) =>
        p.id === productId
          ? { ...p, sizes: { ...p.sizes, [size]: Math.max(0, newQty) } }
          : p
      )
    );
  };

  // Delete product
  const deleteProduct = (productId) => {
    setConfirmDelete({ open: true, productId });
  };

  const handleConfirmDelete = () => {
    setProducts(products.filter((p) => p.id !== confirmDelete.productId));
    setConfirmDelete({ open: false, productId: null });
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ open: false, productId: null });
  };

  // Process sale
  const processSale = () => {
    const product = products.find(
      (p) => p.id === parseInt(currentSale.productId)
    );

    if (!product) return;

    // Check if enough stock
    if (product.sizes[currentSale.size] < currentSale.quantity) {
      alert(
        `Not enough stock! Only ${product.sizes[currentSale.size]} available.`
      );
      return;
    }

    // Create sale record
    const sale = {
      id: Date.now(),
      product: product.name,
      size: currentSale.size,
      quantity: currentSale.quantity,
      unitPrice: product.price,
      total: product.price * currentSale.quantity,
      paymentMethod: currentSale.paymentMethod,
      timestamp: new Date().toISOString(),
    };

    // Update sales
    setSales([...sales, sale]);

    // Update product stock
    updateProductStock(
      product.id,
      currentSale.size,
      product.sizes[currentSale.size] - currentSale.quantity
    );

    // Reset sale form
    setCurrentSale({
      productId: "",
      size: "",
      quantity: 1,
      paymentMethod: "Cash",
    });

    alert(`Sale completed successfully! Total: $${sale.total}`);
  };

  // Export CSV
  const exportTodayCSV = () => {
    const todaysSales = getTodaysSales();
    if (todaysSales.length === 0) {
      alert("No sales today to export");
      return;
    }

    const csv = [
      "Time,Product,Size,Quantity,Unit Price,Total,Payment Method",
      ...todaysSales.map(
        (sale) =>
          `${new Date(sale.timestamp).toLocaleTimeString()},${sale.product},${
            sale.size
          },${sale.quantity},${sale.unitPrice},${sale.total},${
            sale.paymentMethod
          }`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `sales-${new Date().toDateString()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const selectedProduct = products.find(
    (p) => p.id === parseInt(currentSale.productId)
  );
  const todaysSales = getTodaysSales();
  const todaysTotal = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalItems = products.reduce(
    (total, product) =>
      total + Object.values(product.sizes).reduce((sum, qty) => sum + qty, 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Steppinstyle POS System
          </h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Revenue */}
            <div className="bg-green-50 hover:bg-green-100 transition rounded-xl p-5 shadow flex items-center">
              <shilling className="h-10 w-10 text-green-600 mr-4" />
              <div>
                <p className="text-sm text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-green-700">
                  KES{todaysTotal.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Sales Today */}
            <div className="bg-blue-50 hover:bg-blue-100 transition rounded-xl p-5 shadow flex items-center">
              <ShoppingCart className="h-10 w-10 text-blue-600 mr-4" />
              <div>
                <p className="text-sm text-gray-600">Sales Today</p>
                <p className="text-2xl font-bold text-blue-700">
                  {todaysSales.length}
                </p>
              </div>
            </div>

            {/* Total Stock */}
            <div className="bg-purple-50 hover:bg-purple-100 transition rounded-xl p-5 shadow flex items-center">
              <Package className="h-10 w-10 text-purple-600 mr-4" />
              <div>
                <p className="text-sm text-gray-600">Total Stock</p>
                <p className="text-2xl font-bold text-purple-700">
                  {totalItems}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Navigation */}
      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="flex border-b">
          {[
            { key: "sale", label: "Make Sale", icon: ShoppingCart },
            { key: "inventory", label: "Manage Inventory", icon: Package },
            { key: "reports", label: "Sales Reports", icon: FileText },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center px-6 py-3 font-medium transition-all ${
                activeTab === key
                  ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="inline-block w-5 h-5 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>
      {/* Sale Tab */}
      {activeTab === "sale" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sale Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">
              Process Sale
            </h2>

            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No products in inventory</p>
                <button
                  onClick={() => setActiveTab("inventory")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  ➕ Add Products
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Product Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Product
                  </label>
                  <select
                    value={currentSale.productId}
                    onChange={(e) =>
                      setCurrentSale({
                        ...currentSale,
                        productId: e.target.value,
                        size: "",
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a product...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ${product.price}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Size Select */}
                {selectedProduct && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size Available
                    </label>
                    <select
                      value={currentSale.size}
                      onChange={(e) =>
                        setCurrentSale({
                          ...currentSale,
                          size: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Choose size...</option>
                      {Object.entries(selectedProduct.sizes)
                        .filter(([size, qty]) => qty > 0)
                        .map(([size, qty]) => (
                          <option key={size} value={size}>
                            Size {size} ({qty} in stock)
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() =>
                        setCurrentSale({
                          ...currentSale,
                          quantity: Math.max(1, currentSale.quantity - 1),
                        })
                      }
                      className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={currentSale.quantity}
                      onChange={(e) =>
                        setCurrentSale({
                          ...currentSale,
                          quantity: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-20 p-3 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                    <button
                      onClick={() =>
                        setCurrentSale({
                          ...currentSale,
                          quantity: currentSale.quantity + 1,
                        })
                      }
                      className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={currentSale.paymentMethod}
                    onChange={(e) =>
                      setCurrentSale({
                        ...currentSale,
                        paymentMethod: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Cash">Cash</option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Card">Card</option>
                  </select>
                </div>

                {/* Sale Summary */}
                {selectedProduct && currentSale.size && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2 text-gray-800">
                      Sale Summary
                    </h3>
                    <p>Product: {selectedProduct.name}</p>
                    <p>Size: {currentSale.size}</p>
                    <p>Quantity: {currentSale.quantity}</p>
                    <p>Unit Price: ${selectedProduct.price}</p>
                    <p className="text-xl font-bold text-green-600 mt-2">
                      Total: $
                      {(selectedProduct.price * currentSale.quantity).toFixed(
                        2
                      )}
                    </p>
                  </div>
                )}

                {/* Complete Sale */}
                <button
                  onClick={processSale}
                  disabled={!currentSale.productId || !currentSale.size}
                  className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg transition"
                >
                  💰 COMPLETE SALE
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Recent Sales */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Today's Sales
        </h2>
        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
          {todaysSales.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              No sales yet today
            </p>
          ) : (
            [...todaysSales].reverse().map((sale) => (
              <div
                key={sale.id}
                className="border-b last:border-none py-3 flex justify-between items-center hover:bg-gray-50 rounded-lg px-2 transition"
              >
                <div>
                  <span className="font-medium text-gray-800">
                    {sale.product}
                  </span>{" "}
                  <span className="text-gray-600">(Size {sale.size})</span>
                  <br />
                  <span className="text-xs text-gray-500">
                    {new Date(sale.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-green-600 font-bold">
                    +${sale.total.toFixed(2)}
                  </span>
                  <span className="block text-xs text-gray-600">
                    {sale.quantity} × ${sale.unitPrice} ({sale.paymentMethod})
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Inventory Tab */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          {/* Manage Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Manage Inventory
            </h2>
            <button
              onClick={() => setIsAddingProduct(true)}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center transition"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </button>
          </div>

          {/* Add Product Form */}
          {isAddingProduct && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-gray-800">
                  Add New Product
                </h3>
                <button
                  onClick={() => setIsAddingProduct(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Nike Air Max 90"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (KES)
                  </label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="150"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Sizes Grid */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantities by Size
                </label>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                  {Object.keys(newProduct.sizes).map((size) => (
                    <div key={size}>
                      <label className="block text-xs text-gray-600 mb-1">
                        Size {size}
                      </label>
                      <input
                        type="number"
                        value={newProduct.sizes[size]}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            sizes: {
                              ...newProduct.sizes,
                              [size]: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={addProduct}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center transition"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Add Product
                </button>
                <button
                  onClick={() => setIsAddingProduct(false)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Products List */}
      {products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Products Yet
          </h3>
          <p className="text-gray-500">
            Start by adding your first product to the inventory
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-5 text-gray-800">
            Current Inventory ({products.length} products)
          </h3>
          <div className="space-y-5">
            {products.map((product) => (
              <div
                key={product.id}
                className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
              >
                {/* Product Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {product.name}
                    </h4>
                    <p className="text-gray-600 font-medium">
                      ${product.price}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setEditingProduct(product.id)}
                      className="text-blue-600 hover:text-blue-800 transition"
                    >
                      <Edit3 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Sizes Grid */}
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {Object.entries(product.sizes).map(([size, qty]) => (
                    <div key={size} className="text-center">
                      <div className="text-xs text-gray-600 mb-1">
                        Size {size}
                      </div>
                      {editingProduct === product.id ? (
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) =>
                            updateProductStock(
                              product.id,
                              size,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                        />
                      ) : (
                        <div
                          className={`p-2 rounded-lg text-sm font-medium ${
                            qty === 0
                              ? "bg-red-100 text-red-700"
                              : qty < 3
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {qty}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Edit Actions */}
                {editingProduct === product.id && (
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => setEditingProduct(null)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                    >
                      ✅ Done Editing
                    </button>
                    <button
                      onClick={() => setEditingProduct(null)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Total Stock */}
                <div className="mt-3 text-right text-sm text-gray-600">
                  Total:{" "}
                  {Object.values(product.sizes).reduce(
                    (sum, qty) => sum + qty,
                    0
                  )}{" "}
                  pairs
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {confirmDelete.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this product? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-800">
                Today's Sales Report
              </h3>
              <button
                onClick={exportTodayCSV}
                disabled={todaysSales.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                📊 Export CSV
              </button>
            </div>

            {/* Sales Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm text-gray-700">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium">Time</th>
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-center p-3 font-medium">Size</th>
                    <th className="text-center p-3 font-medium">Qty</th>
                    <th className="text-center p-3 font-medium">Unit Price</th>
                    <th className="text-center p-3 font-medium">Total</th>
                    <th className="text-center p-3 font-medium">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {todaysSales.map((sale, idx) => (
                    <tr
                      key={sale.id}
                      className={`border-b ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-gray-100 transition`}
                    >
                      <td className="p-3">
                        {new Date(sale.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-3 font-medium">{sale.product}</td>
                      <td className="p-3 text-center">{sale.size}</td>
                      <td className="p-3 text-center">{sale.quantity}</td>
                      <td className="p-3 text-center">${sale.unitPrice}</td>
                      <td className="p-3 text-center font-semibold text-green-600">
                        ${sale.total.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            sale.paymentMethod === "Cash"
                              ? "bg-green-100 text-green-700"
                              : sale.paymentMethod === "M-Pesa"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {sale.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Empty State */}
              {todaysSales.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-sm">
                    No sales recorded today
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoePOSSystem;
