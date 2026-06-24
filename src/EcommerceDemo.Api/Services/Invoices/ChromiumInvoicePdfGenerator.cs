using Microsoft.Extensions.Options;
using PuppeteerSharp;
using PuppeteerSharp.Media;

namespace EcommerceDemo.Api.Services.Invoices;

public sealed class ChromiumInvoicePdfGenerator(
    IOptions<InvoicePdfOptions> options,
    ILogger<ChromiumInvoicePdfGenerator> logger) : IInvoicePdfGenerator, IAsyncDisposable
{
    private readonly InvoicePdfOptions _options = options.Value;
    private readonly SemaphoreSlim _browserLock = new(1, 1);
    private IBrowser? _browser;

    public async Task<byte[]> GenerateAsync(string html, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var browser = await GetBrowserAsync(cancellationToken);
        await using var page = await browser.NewPageAsync();
        await page.SetContentAsync(html, new SetContentOptions
        {
            WaitUntil = [WaitUntilNavigation.Load]
        });
        cancellationToken.ThrowIfCancellationRequested();

        return await page.PdfDataAsync(new PdfOptions
        {
            Format = PaperFormat.A4,
            PrintBackground = true,
            PreferCSSPageSize = true,
            MarginOptions = new MarginOptions
            {
                Top = "12mm",
                Right = "12mm",
                Bottom = "12mm",
                Left = "12mm"
            }
        });
    }

    public async ValueTask DisposeAsync()
    {
        if (_browser is not null)
        {
            await _browser.DisposeAsync();
        }

        _browserLock.Dispose();
    }

    private async Task<IBrowser> GetBrowserAsync(CancellationToken cancellationToken)
    {
        if (_browser is { IsClosed: false })
        {
            return _browser;
        }

        await _browserLock.WaitAsync(cancellationToken);
        try
        {
            if (_browser is { IsClosed: false })
            {
                return _browser;
            }

            var executablePath = await ResolveExecutablePathAsync(cancellationToken);
            var arguments = _options.DisableSandbox
                ? new[] { "--no-sandbox", "--disable-setuid-sandbox" }
                : [];

            _browser = await Puppeteer.LaunchAsync(new LaunchOptions
            {
                Headless = true,
                ExecutablePath = executablePath,
                Args = arguments
            });

            return _browser;
        }
        finally
        {
            _browserLock.Release();
        }
    }

    private async Task<string> ResolveExecutablePathAsync(CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(_options.BrowserExecutablePath))
        {
            var configuredPath = Path.GetFullPath(_options.BrowserExecutablePath);
            if (!File.Exists(configuredPath))
            {
                throw new InvalidOperationException($"Configured invoice PDF browser was not found at '{configuredPath}'.");
            }

            return configuredPath;
        }

        var installedPath = KnownBrowserPaths().FirstOrDefault(File.Exists);
        if (installedPath is not null)
        {
            return installedPath;
        }

        if (!_options.AllowBrowserDownload)
        {
            throw new InvalidOperationException(
                "Invoice PDF generation requires InvoicePdf__BrowserExecutablePath or InvoicePdf__AllowBrowserDownload=true.");
        }

        logger.LogInformation("Downloading a managed Chromium build for invoice PDF generation.");
        cancellationToken.ThrowIfCancellationRequested();
        var installedBrowser = await new BrowserFetcher().DownloadAsync();
        cancellationToken.ThrowIfCancellationRequested();
        return installedBrowser.GetExecutablePath();
    }

    private static IEnumerable<string> KnownBrowserPaths()
    {
        if (OperatingSystem.IsWindows())
        {
            var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
            var programFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
            var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

            yield return Path.Combine(programFiles, "Google", "Chrome", "Application", "chrome.exe");
            yield return Path.Combine(programFilesX86, "Google", "Chrome", "Application", "chrome.exe");
            yield return Path.Combine(programFiles, "Microsoft", "Edge", "Application", "msedge.exe");
            yield return Path.Combine(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe");
            yield return Path.Combine(localAppData, "Google", "Chrome", "Application", "chrome.exe");
            yield break;
        }

        yield return "/usr/bin/chromium";
        yield return "/usr/bin/chromium-browser";
        yield return "/usr/bin/google-chrome";
        yield return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    }
}
