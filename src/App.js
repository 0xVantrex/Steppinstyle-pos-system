import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingCart,
  Package,
  FileText,
  DollarSign,
  Plus,
  Minus,
  Edit3,
  Trash2,
  Save,
  X,
  Download,
  Upload,
  Database,
  Search,
  Filter,
  AlertCircle,
  TrendingUp,
  Clock,
  Users,
} from "lucide-react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseconfig";

const ShoePOSSystem = () => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [currentSale, setCurrentSale] = useState({
    productId: "",
    size: "",
    quantity: 1,
    paymentMethod: "Cash",
    customer: "Walk-in",
    discount: 0,
  });
  const [activeTab, setActiveTab] = useState("sale");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    productId: null,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [showLowStock, setShowLowStock] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "Sneakers",
    sizes: {
      20: 0,
      21: 0,
      22: 0,
      23: 0,
      24: 0,
      25: 0,
      26: 0,
      27: 0,
      28: 0,
      29: 0,
      30: 0,
      31: 0,
      32: 0,
      33: 0,
      34: 0,
      35: 0,
      36: 0,
      37: 0,
      38: 0,
      39: 0,
      40: 0,
      41: 0,
      42: 0,
      43: 0,
      44: 0,
      45: 0,
      46: 0,
    },
  });

  // Firebase operations
  const loadProducts = async () => {
    try {
      setLoading(true);

      const productRef = collection(db, "products");
      const q = query(productRef, orderBy("dateAdded", "desc"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const productData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productData);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error loading products:", error);
      alert("Error loading products. Please try again.");
      setLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      const salesRef = collection(db, "sales");
      const q = query(salesRef, orderBy("timestamp", "desc"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const salesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        }));
        setSales(salesData);
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error loading sales:", error);
      alert("Error loading sales data. Please try again.");
    }
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      alert("Please enter product name and price");
      return;
    }

    try {
      setLoading(true);

      const productData = {
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        sizes: { ...newProduct.sizes },
        dateAdded: new Date(),
      };

      await addDoc(collection(db, "products"), productData);

      setNewProduct({
        name: "",
        price: "",
        category: "Sneakers",
        sizes: Object.fromEntries(
          Array.from({ length: 12 }, (_, i) => [35 + i, 0])
        ),
      });

      setIsAddingProduct(false);
      alert("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error adding product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productId, updates) => {
    try {
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, updates);
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error updating product. Please try again.");
    }
  };

  const updateProductStock = async (productId, size, newQty) => {
    try {
      const product = products.find((p) => p.id === productId);
      await updateProduct(productId, {
        sizes: { ...product.sizes, [size]: Math.max(0, newQty) },
      });
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Error updating stock. Please try again.");
    }
  };

  const deleteProduct = (productId) => {
    setConfirmDelete({ open: true, productId });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "products", confirmDelete.productId));
      setConfirmDelete({ open: false, productId: null });
      alert("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product. Please try again.");
    }
  };

  const processSale = async () => {
    const product = products.find((p) => p.id === currentSale.productId);
    if (!product) return;

    if (product.sizes[currentSale.size] < currentSale.quantity) {
      alert(
        `Not enough stock! Only ${product.sizes[currentSale.size]} available.`
      );
      return;
    }

    try {
      const subtotal = product.price * currentSale.quantity;
      const discountAmount = (subtotal * currentSale.discount) / 100;
      const total = subtotal - discountAmount;

      const saleData = {
        product: product.name,
        productId: product.id,
        size: currentSale.size,
        quantity: currentSale.quantity,
        unitPrice: product.price,
        total: total,
        paymentMethod: currentSale.paymentMethod,
        customer: currentSale.customer,
        discount: currentSale.discount,
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "sales"), saleData);

      // Update stock
      await updateProductStock(
        product.id,
        currentSale.size,
        product.sizes[currentSale.size] - currentSale.quantity
      );

      setCurrentSale({
        productId: "",
        size: "",
        quantity: 1,
        paymentMethod: "Cash",
        customer: "Walk-in",
        discount: 0,
      });

      alert(`Sale completed! Total: KES ${total.toFixed(2)}`);
    } catch (error) {
      console.error("Error processing sale:", error);
      alert("Error processing sale. Please try again.");
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      await loadProducts();
      await loadSales();
    };

    loadData();
  }, []);

  // Enhanced calculations with useMemo for performance
  const analytics = useMemo(() => {
    const today = new Date().toDateString();
    const todaysSales = sales.filter(
      (sale) => new Date(sale.timestamp).toDateString() === today
    );

    const totalRevenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalItems = products.reduce(
      (total, product) =>
        total + Object.values(product.sizes).reduce((sum, qty) => sum + qty, 0),
      0
    );

    const lowStockItems = products.filter(
      (product) =>
        Object.values(product.sizes).reduce((sum, qty) => sum + qty, 0) < 5
    );

    const categories = [...new Set(products.map((p) => p.category))];

    const topSellingProducts = sales.reduce((acc, sale) => {
      acc[sale.product] = (acc[sale.product] || 0) + sale.quantity;
      return acc;
    }, {});

    return {
      todaysSales,
      totalRevenue,
      totalItems,
      lowStockItems,
      categories,
      topSellingProducts,
      salesCount: todaysSales.length,
    };
  }, [sales, products]);

  // Filtered products for inventory display
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;
      const isLowStock =
        Object.values(product.sizes).reduce((sum, qty) => sum + qty, 0) < 5;
      const matchesStockFilter = !showLowStock || isLowStock;

      return matchesSearch && matchesCategory && matchesStockFilter;
    });
  }, [products, searchTerm, categoryFilter, showLowStock]);

  const exportTodayCSV = () => {
    if (analytics.todaysSales.length === 0) {
      alert("No sales today to export");
      return;
    }

    const csv = [
      "Time,Product,Size,Quantity,Unit Price,Discount %,Total,Payment Method,Customer",
      ...analytics.todaysSales.map((sale) => {
        const saleTime = new Date(sale.timestamp).toLocaleTimeString();
        return `${saleTime},${sale.product},${sale.size},${sale.quantity},${
          sale.unitPrice
        },${sale.discount || 0},${sale.total},${sale.paymentMethod},${
          sale.customer
        }`;
      }),
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

  const selectedProduct = products.find((p) => p.id === currentSale.productId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data from Firebase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header with Better Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Steppinstyle POS System
              </h1>
              <div className="flex items-center text-sm text-gray-600">
                <Database className="h-4 w-4 mr-1" />
                Firebase Connected
                <div className="ml-4 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date().toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex space-x-2 mt-4 lg:mt-0">
              <button
                onClick={loadProducts}
                className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium hover:bg-blue-200 transition cursor-pointer flex items-center"
              >
                <Upload className="h-4 w-4 mr-1" />
                Sync Data
              </button>
              <button
                onClick={exportTodayCSV}
                className="bg-green-100 text-green-700 px-3 py-2 rounded-lg font-medium hover:bg-green-200 transition flex items-center"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-150 transition rounded-xl p-4 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">
                    Today's Revenue
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    KES {analytics.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150 transition rounded-xl p-4 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    Sales Today
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {analytics.salesCount}
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-150 transition rounded-xl p-4 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">
                    Total Stock
                  </p>
                  <p className="text-2xl font-bold text-purple-700">
                    {analytics.totalItems}
                  </p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-150 transition rounded-xl p-4 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">
                    Low Stock Items
                  </p>
                  <p className="text-2xl font-bold text-orange-700">
                    {analytics.lowStockItems.length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Low Stock Alert */}
          {analytics.lowStockItems.length > 0 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                <p className="text-orange-700 font-medium">
                  {analytics.lowStockItems.length} item(s) running low on stock
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Navigation */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b overflow-x-auto">
            {[
              { key: "sale", label: "Point of Sale", icon: ShoppingCart },
              { key: "inventory", label: "Inventory", icon: Package },
              { key: "reports", label: "Analytics", icon: TrendingUp },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  activeTab === key
                    ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="inline-block w-5 h-5 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Sale Tab */}
        {activeTab === "sale" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Enhanced Sale Form */}
            <div className="xl:col-span-2 bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Process New Sale
              </h2>

              {products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No products in inventory</p>
                  <button
                    onClick={() => setActiveTab("inventory")}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    Add Products
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Product Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            {product.name} - KES{" "}
                            {product.price.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Type
                      </label>
                      <select
                        value={currentSale.customer}
                        onChange={(e) =>
                          setCurrentSale({
                            ...currentSale,
                            customer: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Walk-in">Walk-in Customer</option>
                        <option value="Regular">Regular Customer</option>
                        <option value="VIP">VIP Customer</option>
                      </select>
                    </div>
                  </div>

                  {/* Size and Quantity */}
                  {selectedProduct && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Available Sizes
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
                                Size {size} ({qty} available)
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <div className="flex items-center">
                          <button
                            onClick={() =>
                              setCurrentSale({
                                ...currentSale,
                                quantity: Math.max(1, currentSale.quantity - 1),
                              })
                            }
                            className="p-2 bg-gray-200 rounded-l-lg hover:bg-gray-300 transition"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            value={currentSale.quantity}
                            onChange={(e) =>
                              setCurrentSale({
                                ...currentSale,
                                quantity: Math.max(
                                  1,
                                  parseInt(e.target.value) || 1
                                ),
                              })
                            }
                            className="w-16 p-3 border-t border-b border-gray-300 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="1"
                          />
                          <button
                            onClick={() =>
                              setCurrentSale({
                                ...currentSale,
                                quantity: currentSale.quantity + 1,
                              })
                            }
                            className="p-2 bg-gray-200 rounded-r-lg hover:bg-gray-300 transition"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Discount (%)
                        </label>
                        <input
                          type="number"
                          value={currentSale.discount}
                          onChange={(e) =>
                            setCurrentSale({
                              ...currentSale,
                              discount: Math.max(
                                0,
                                Math.min(50, parseFloat(e.target.value) || 0)
                              ),
                            })
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          max="50"
                          step="0.1"
                        />
                      </div>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Cash", "M-Pesa", "Card"].map((method) => (
                        <button
                          key={method}
                          onClick={() =>
                            setCurrentSale({
                              ...currentSale,
                              paymentMethod: method,
                            })
                          }
                          className={`p-3 rounded-lg border-2 transition ${
                            currentSale.paymentMethod === method
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Sale Summary */}
                  {selectedProduct && currentSale.size && (
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border">
                      <h3 className="font-semibold mb-4 text-gray-800 text-lg">
                        Sale Summary
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Product:</span>
                          <span className="font-medium">
                            {selectedProduct.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span className="font-medium">
                            {currentSale.size}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quantity:</span>
                          <span className="font-medium">
                            {currentSale.quantity}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unit Price:</span>
                          <span className="font-medium">
                            KES {selectedProduct.price.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span className="font-medium">
                            KES{" "}
                            {(
                              selectedProduct.price * currentSale.quantity
                            ).toLocaleString()}
                          </span>
                        </div>
                        {currentSale.discount > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Discount ({currentSale.discount}%):</span>
                            <span className="font-medium">
                              -KES{" "}
                              {(
                                (selectedProduct.price *
                                  currentSale.quantity *
                                  currentSale.discount) /
                                100
                              ).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <hr className="my-2" />
                        <div className="flex justify-between text-xl font-bold text-green-600">
                          <span>Total:</span>
                          <span>
                            KES{" "}
                            {(
                              selectedProduct.price *
                              currentSale.quantity *
                              (1 - currentSale.discount / 100)
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Complete Sale Button */}
                  <button
                    onClick={processSale}
                    disabled={!currentSale.productId || !currentSale.size}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-lg transition transform hover:scale-105 active:scale-95"
                  >
                    Complete Sale
                  </button>
                </div>
              )}
            </div>

            {/* Enhanced Recent Sales */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Sales
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {analytics.todaysSales.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No sales yet today</p>
                  </div>
                ) : (
                  analytics.todaysSales.slice(0, 10).map((sale) => (
                    <div
                      key={sale.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">
                            {sale.product}
                          </div>
                          <div className="text-sm text-gray-600">
                            Size {sale.size} • Qty: {sale.quantity} •{" "}
                            {sale.paymentMethod}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(sale.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            KES {sale.total.toLocaleString()}
                          </div>
                          {sale.discount > 0 && (
                            <div className="text-xs text-red-500">
                              {sale.discount}% off
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Inventory Tab */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            {/* Inventory Controls */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Inventory Management
                </h2>
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {analytics.categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowLowStock(!showLowStock)}
                    className={`px-3 py-2 rounded-lg font-medium transition ${
                      showLowStock
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <Filter className="h-4 w-4 inline mr-1" />
                    Low Stock
                  </button>
                  <button
                    onClick={() => setIsAddingProduct(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center transition"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Add Product Form */}
            {isAddingProduct && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (KES) *
                    </label>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: e.target.value })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="8500"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Sneakers">Sneakers</option>
                      <option value="Running">Running</option>
                      <option value="Casual">Casual</option>
                      <option value="Formal">Formal</option>
                      <option value="Boots">Boots</option>
                      <option value="Sandals">Sandals</option>
                    </select>
                  </div>
                </div>

                {/* Enhanced Sizes Grid */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Stock Quantities by Size
                  </label>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {Object.keys(newProduct.sizes).map((size) => (
                      <div key={size} className="text-center">
                        <label className="block text-xs text-gray-600 mb-1 font-medium">
                          {size}
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

                <div className="flex space-x-4">
                  <button
                    onClick={addProduct}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 flex items-center transition"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Add Product
                  </button>
                  <button
                    onClick={() => setIsAddingProduct(false)}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Enhanced Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {products.length === 0
                    ? "No Products Yet"
                    : "No Products Match Filters"}
                </h3>
                <p className="text-gray-500">
                  {products.length === 0
                    ? "Start by adding your first product to the inventory"
                    : "Try adjusting your search or filter criteria"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredProducts.map((product) => {
                  const totalStock = Object.values(product.sizes).reduce(
                    (sum, qty) => sum + qty,
                    0
                  );
                  const isLowStock = totalStock < 5;

                  return (
                    <div
                      key={product.id}
                      className={`bg-white border rounded-xl p-6 hover:shadow-lg transition ${
                        isLowStock
                          ? "border-orange-300 bg-orange-50"
                          : "border-gray-200"
                      }`}
                    >
                      {/* Product Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {product.name}
                            </h4>
                            {isLowStock && (
                              <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs font-medium rounded-full">
                                Low Stock
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-green-600 font-bold text-lg">
                              KES {product.price.toLocaleString()}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {product.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingProduct(product.id)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Sizes Grid */}
                      <div className="grid grid-cols-6 gap-2 mb-4">
                        {Object.entries(product.sizes).map(([size, qty]) => (
                          <div key={size} className="text-center">
                            <div className="text-xs text-gray-600 mb-1">
                              {size}
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
                                className="w-full p-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min="0"
                              />
                            ) : (
                              <div
                                className={`p-1 rounded text-sm font-medium ${
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
                        <div className="flex space-x-2 mb-3">
                          <button
                            onClick={() => setEditingProduct(null)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 transition"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setEditingProduct(null)}
                            className="bg-gray-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-gray-600 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {/* Stock Summary */}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Total Stock:</span>
                        <span
                          className={`font-semibold ${
                            isLowStock ? "text-orange-600" : "text-gray-800"
                          }`}
                        >
                          {totalStock} pairs
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Analytics/Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Today's Performance
                  </h3>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-bold text-green-600">
                      KES {analytics.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sales:</span>
                    <span className="font-bold">{analytics.salesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Sale:</span>
                    <span className="font-bold">
                      KES{" "}
                      {analytics.salesCount > 0
                        ? (
                            analytics.totalRevenue / analytics.salesCount
                          ).toFixed(0)
                        : "0"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Inventory Status
                  </h3>
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Products:</span>
                    <span className="font-bold">{products.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Stock:</span>
                    <span className="font-bold">{analytics.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Low Stock:</span>
                    <span
                      className={`font-bold ${
                        analytics.lowStockItems.length > 0
                          ? "text-orange-600"
                          : "text-green-600"
                      }`}
                    >
                      {analytics.lowStockItems.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Payment Methods
                  </h3>
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div className="space-y-3">
                  {["Cash", "M-Pesa", "Card"].map((method) => {
                    const methodSales = analytics.todaysSales.filter(
                      (s) => s.paymentMethod === method
                    );
                    const methodTotal = methodSales.reduce(
                      (sum, s) => sum + s.total,
                      0
                    );
                    return (
                      <div key={method} className="flex justify-between">
                        <span className="text-gray-600">{method}:</span>
                        <span className="font-bold">
                          KES {methodTotal.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Customer Types
                  </h3>
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="space-y-3">
                  {["Walk-in", "Regular", "VIP"].map((type) => {
                    const typeSales = analytics.todaysSales.filter(
                      (s) => s.customer === type
                    );
                    return (
                      <div key={type} className="flex justify-between">
                        <span className="text-gray-600">{type}:</span>
                        <span className="font-bold">{typeSales.length}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Detailed Sales Report */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  Detailed Sales Report
                </h3>
                <div className="flex space-x-3">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                  <button
                    onClick={exportTodayCSV}
                    disabled={analytics.todaysSales.length === 0}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-700">
                        Time
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-700">
                        Product
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-700">
                        Size
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-700">
                        Qty
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-700">
                        Unit Price
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-700">
                        Discount
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-700">
                        Total
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-700">
                        Payment
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-700">
                        Customer
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.todaysSales.map((sale, idx) => (
                      <tr
                        key={sale.id}
                        className={`border-b hover:bg-gray-50 transition ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="p-4">
                          {new Date(sale.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-4 font-medium">{sale.product}</td>
                        <td className="p-4 text-center">{sale.size}</td>
                        <td className="p-4 text-center">{sale.quantity}</td>
                        <td className="p-4 text-center">
                          KES {sale.unitPrice.toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                          {sale.discount > 0 ? `${sale.discount}%` : "-"}
                        </td>
                        <td className="p-4 text-center font-semibold text-green-600">
                          KES {sale.total.toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                        <td className="p-4 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              sale.customer === "VIP"
                                ? "bg-gold-100 text-gold-700"
                                : sale.customer === "Regular"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {sale.customer}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {analytics.todaysSales.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No sales recorded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Delete Confirmation Modal */}
        {confirmDelete.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-2 rounded-full mr-3">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Product
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this product? This action cannot
                be undone and will remove all associated data.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() =>
                    setConfirmDelete({ open: false, productId: null })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoePOSSystem;
