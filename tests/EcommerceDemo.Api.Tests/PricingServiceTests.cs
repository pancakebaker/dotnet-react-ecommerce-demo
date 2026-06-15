using EcommerceDemo.Api.Services;

namespace EcommerceDemo.Api.Tests;

public sealed class PricingServiceTests
{
    [Fact]
    public void CalculateTotals_Rounds_Subtotal_Tax_And_Total()
    {
        var pricing = new OrderPricingService();

        var totals = pricing.CalculateTotals([10.005m, 5.335m], 1.10m);

        Assert.Equal(15.34m, totals.Subtotal);
        Assert.Equal(1.84m, totals.Tax);
        Assert.Equal(16.08m, totals.Total);
    }

    [Fact]
    public void ToMinorCurrencyUnit_Uses_AwayFromZero_Rounding()
    {
        var pricing = new OrderPricingService();

        var cents = pricing.ToMinorCurrencyUnit(12.345m);

        Assert.Equal(1235, cents);
    }
}
