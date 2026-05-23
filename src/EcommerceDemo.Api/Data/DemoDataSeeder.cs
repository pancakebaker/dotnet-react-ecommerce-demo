using Microsoft.EntityFrameworkCore;
using EcommerceDemo.Api.Domain;
using EcommerceDemo.Api.Services;

namespace EcommerceDemo.Api.Data;

public static class DemoDataSeeder
{
    public static async Task SeedAsync(AppDbContext db, IPasswordHasher passwordHasher)
    {
        await db.Database.EnsureCreatedAsync();

        if (await db.Users.AnyAsync())
        {
            return;
        }

        var admin = new User
        {
            FirstName = "Ava",
            LastName = "Admin",
            Email = "admin@ecommerce-demo.test",
            Role = Roles.Admin,
            PasswordHash = passwordHasher.Hash("Password123!")
        };

        var staff = new User
        {
            FirstName = "Sam",
            LastName = "Staff",
            Email = "staff@ecommerce-demo.test",
            Role = Roles.Staff,
            PasswordHash = passwordHasher.Hash("Password123!")
        };

        var customers = new[]
        {
            new Customer { Name = "Northwind Supplies", CompanyName = "Northwind", Email = "orders@northwind.test", Phone = "+1 555-0100", Address = "101 Market Street" },
            new Customer { Name = "Blue Harbor Cafe", CompanyName = "Blue Harbor", Email = "buying@blueharbor.test", Phone = "+1 555-0112", Address = "88 Waterfront Ave" },
            new Customer { Name = "Acme Retail Group", CompanyName = "Acme Retail", Email = "ops@acmeretail.test", Phone = "+1 555-0154", Address = "42 Commerce Park" }
        };

        var products = new[]
        {
            new Product { Name = "Countertop Scanner", Sku = "SCN-100", Description = "Compact barcode scanner", Price = 149.00m, StockQuantity = 24, IsActive = true },
            new Product { Name = "Receipt Printer", Sku = "PRN-220", Description = "Thermal printer for order desks", Price = 229.00m, StockQuantity = 16, IsActive = true },
            new Product { Name = "Inventory Labels", Sku = "LBL-500", Description = "Water resistant label roll", Price = 19.95m, StockQuantity = 180, IsActive = true },
            new Product { Name = "Shipping Label Printer", Sku = "SHP-310", Description = "High-speed printer for shipping labels", Price = 279.00m, StockQuantity = 12, IsActive = true },
            new Product { Name = "Mobile POS Tablet", Sku = "POS-700", Description = "Rugged tablet for mobile order entry", Price = 399.00m, StockQuantity = 9, IsActive = true },
            new Product { Name = "Cash Drawer", Sku = "CDR-440", Description = "Steel cash drawer with receipt printer trigger", Price = 119.00m, StockQuantity = 14, IsActive = true },
            new Product { Name = "Handheld Scanner", Sku = "HSC-210", Description = "Wireless scanner for stock rooms and receiving", Price = 189.00m, StockQuantity = 21, IsActive = true },
            new Product { Name = "Packing Tape Case", Sku = "TPE-120", Description = "Clear packing tape for fulfillment stations", Price = 34.50m, StockQuantity = 72, IsActive = true },
            new Product { Name = "Barcode Label Roll", Sku = "BCL-250", Description = "Thermal barcode labels for inventory tracking", Price = 29.95m, StockQuantity = 130, IsActive = true },
            new Product { Name = "Order Desk Stand", Sku = "ODS-880", Description = "Adjustable stand for tablets and order monitors", Price = 84.00m, StockQuantity = 18, IsActive = true }
        };

        var order = new Order
        {
            OrderNumber = $"OF-{DateTime.UtcNow:yyyyMMdd}-0001",
            Customer = customers[0],
            CreatedByUser = admin,
            Status = OrderStatuses.Processing,
            Discount = 15m
        };

        order.Items.Add(new OrderItem
        {
            Product = products[0],
            ProductName = products[0].Name,
            Quantity = 2,
            UnitPrice = products[0].Price,
            LineTotal = 2 * products[0].Price
        });
        order.Items.Add(new OrderItem
        {
            Product = products[2],
            ProductName = products[2].Name,
            Quantity = 5,
            UnitPrice = products[2].Price,
            LineTotal = 5 * products[2].Price
        });

        order.Subtotal = order.Items.Sum(item => item.LineTotal);
        order.Tax = decimal.Round(order.Subtotal * 0.12m, 2);
        order.Total = order.Subtotal + order.Tax - order.Discount;

        db.Users.AddRange(admin, staff);
        db.Customers.AddRange(customers);
        db.Products.AddRange(products);
        db.Orders.Add(order);
        db.ActivityLogs.Add(new ActivityLog
        {
            EntityType = "Order",
            EntityId = order.Id,
            Action = "Seeded",
            Description = $"Demo order {order.OrderNumber} was created.",
            User = admin
        });

        await db.SaveChangesAsync();
    }
}
