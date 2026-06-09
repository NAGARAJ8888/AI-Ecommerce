"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { getProducts, transformProduct, deleteProduct, Product } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AdminLoadingState } from "@/components/admin/admin-loading-state";
// AdminErrorState is available for future use.

import { AdminShell } from "@/components/admin/admin-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";
import { toast } from "@/components/ui/use-toast";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  MoreHorizontal,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { AdminOrdersPanel } from "@/components/admin/admin-orders-panel";
import { AdminAnalyticsPanel } from "@/components/admin/admin-analytics-panel";

import { AdminPaymentsPanel } from "@/components/admin/admin-payments-panel";


// Removed unused mocked Orders data for now; Orders panel is handled by `AdminOrdersPanel`.


// Mock data for recent orders (can be replaced with API later)
const recentOrders = [
  {
    id: "ORD-001",
    customer: "John Doe",
    email: "john@example.com",
    amount: 385,
    status: "completed",
    date: "2024-01-15",
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    email: "jane@example.com",
    amount: 265,
    status: "processing",
    date: "2024-01-15",
  },
  {
    id: "ORD-003",
    customer: "Robert Johnson",
    email: "robert@example.com",
    amount: 520,
    status: "pending",
    date: "2024-01-14",
  },
  {
    id: "ORD-004",
    customer: "Emily Davis",
    email: "emily@example.com",
    amount: 195,
    status: "completed",
    date: "2024-01-14",
  },
  {
    id: "ORD-005",
    customer: "Michael Wilson",
    email: "michael@example.com",
    amount: 320,
    status: "shipped",
    date: "2024-01-13",
  },
];

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, active: true },
  { name: "Orders", icon: ShoppingCart, active: false },
  { name: "Products", icon: Package, active: false },
  { name: "Customers", icon: Users, active: false },
  { name: "Payments", icon: DollarSign, active: false },
];


export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");

  // Lightweight frontend protection (backend still enforces admin authorization)
  useEffect(() => {
    if (!isLoading && !user?.isAdmin) {
      router.replace("/");
    }
  }, [isLoading, user, router]);


  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Edit mode state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await getProducts({ limit: 100 });
        if (result.success && result.data) {
          const transformedProducts = result.data.data.map(transformProduct);
          setProducts(transformedProducts);
        } else {
          setError(result.message || "Failed to fetch products");
        }
      } catch (err) {
        setError("An error occurred while fetching products");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [refreshKey]);

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Calculate stats from actual product data
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const inStockProducts = products.filter(p => p.inStock).length;
    const outOfStockProducts = totalProducts - inStockProducts;
    
    return [
      {
        title: "Total Revenue",
        value: "$45,231.89",
        change: "+20.1%",
        trend: "up",
        icon: DollarSign,
      },
      {
        title: "Orders",
        value: "2,350",
        change: "+180.1%",
        trend: "up",
        icon: ShoppingCart,
      },
      {
        title: "Products",
        value: totalProducts.toString(),
        change: `${outOfStockProducts} out of stock`,
        trend: outOfStockProducts > 0 ? "warning" : "up",
        icon: Package,
      },
      {
        title: "Active Customers",
        value: "573",
        change: "-5.2%",
        trend: "down",
        icon: Users,
      },
    ];
  }, [products]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      case "shipped":
        return "bg-purple-100 text-purple-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-secondary text-foreground";
    }
  };

  // Handle product dialog success
  const handleProductSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setIsProductDialogOpen(false);
  };

  return (
    <AdminShell
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      onAddProduct={() => setIsProductDialogOpen(true)}
    >
      {/* Main Content */}
      {activeTab === "Dashboard" && (

        <div className="space-y-6">

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center text-xs mt-1">
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                    )}
                    <span
                      className={
                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                      }
                    >
                      {stat.change}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      from last month
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Recent Orders</CardTitle>
              <div className="text-xs text-muted-foreground">Operational overview (mock placeholder until admin order list is wired)</div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer}</p>
                          <p className="text-xs text-muted-foreground">{order.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {order.date}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs rounded-sm capitalize ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">${order.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Operational Analytics (STEP 10.6) */}
          <AdminAnalyticsPanel />

        </div>
      )}

      {activeTab === "Products" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium">Products</h2>
            <Button size="sm" onClick={() => setIsProductDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="relative h-12 w-12 bg-secondary overflow-hidden">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.category}</TableCell>
                      <TableCell>${product.price}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs rounded-sm ${
                            product.inStock
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingProduct(product);
                                setIsProductDialogOpen(true);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingProduct(product);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "Orders" && <AdminOrdersPanel />}

      {activeTab === "Payments" && <AdminPaymentsPanel />}

      {activeTab === "Customers" && (

        <div className="space-y-6">
          <h2 className="text-xl font-medium">Customers</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.customer}</TableCell>
                      <TableCell className="text-muted-foreground">{order.email}</TableCell>
                      <TableCell>{Math.floor(Math.random() * 10) + 1}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${(order.amount * (Math.random() * 3 + 1)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={isProductDialogOpen}
        onOpenChange={(open) => {
          setIsProductDialogOpen(open);
          if (!open) {
            setEditingProduct(null);
          }
        }}
        onSuccess={handleProductSuccess}
        product={editingProduct}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingProduct(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deletingProduct) return;

                setIsDeleting(true);
                try {
                  const result = await deleteProduct(deletingProduct.id);
                  if (result.success) {
                    toast({
                      title: "Product deleted",
                      description: `${deletingProduct.name} has been deleted successfully.`,
                    });
                    setRefreshKey((prev) => prev + 1);
                  } else {
                    toast({
                      title: "Error",
                      description:
                        result.message || "Failed to delete product",
                      variant: "destructive",
                    });
                  }
                } catch {
                  toast({
                    title: "Error",
                    description: "An unexpected error occurred",
                    variant: "destructive",
                  });
                } finally {
                  setIsDeleting(false);
                  setIsDeleteDialogOpen(false);
                  setDeletingProduct(null);
                }
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
