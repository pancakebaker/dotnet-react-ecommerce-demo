using System.Net.Mail;
using System.Text.RegularExpressions;
using EcommerceDemo.Api.Domain;

namespace EcommerceDemo.Api.Validation;

public sealed record SanitizedCustomerInput(string Name, string? CompanyName, string Email, string? Phone, string? Address);
public sealed record SanitizedProductInput(string Name, string Sku, string? Description, decimal Price, int StockQuantity, bool IsActive);
public sealed record SanitizedUserInput(string FirstName, string LastName, string Email, string Password, string Role);
public sealed record SanitizedLoginInput(string Email, string Password);
public sealed record SanitizedProfileInput(string FirstName, string LastName);
public sealed record SanitizedSearchInput(string? Term);

public static partial class InputValidation
{
    private const int NameMaxLength = 150;
    private const int PersonNameMaxLength = 100;
    private const int CompanyMaxLength = 150;
    private const int EmailMaxLength = 255;
    private const int PhoneMaxLength = 50;
    private const int AddressMaxLength = 500;
    private const int ProductDescriptionMaxLength = 1000;
    private const int SkuMaxLength = 80;
    private const int SearchMaxLength = 100;
    private const int IdempotencyKeyMaxLength = 128;
    private const int PaymentReferenceMaxLength = 120;
    private const int PasswordMinLength = 8;
    private const int PasswordMaxLength = 128;

    public static bool TryCustomer(
        string? name,
        string? companyName,
        string? email,
        string? phone,
        string? address,
        out SanitizedCustomerInput input,
        out Dictionary<string, string[]> errors)
    {
        errors = [];

        var cleanName = RequiredText(name, nameof(name), "Customer name", NameMaxLength, errors);
        var cleanCompany = OptionalText(companyName, nameof(companyName), "Company name", CompanyMaxLength, errors);
        var cleanEmail = Email(email, nameof(email), errors);
        var cleanPhone = OptionalText(phone, nameof(phone), "Phone", PhoneMaxLength, errors);
        var cleanAddress = OptionalText(address, nameof(address), "Address", AddressMaxLength, errors, preserveLineBreaks: true);

        if (!string.IsNullOrWhiteSpace(cleanPhone) && !PhonePattern().IsMatch(cleanPhone))
        {
            AddError(errors, nameof(phone), "Phone must use digits, spaces, parentheses, dashes, periods, and an optional leading plus sign.");
        }

        input = new SanitizedCustomerInput(cleanName, cleanCompany, cleanEmail, cleanPhone, cleanAddress);
        return errors.Count == 0;
    }

    public static bool TryProduct(
        string? name,
        string? sku,
        string? description,
        decimal price,
        int stockQuantity,
        bool isActive,
        out SanitizedProductInput input,
        out Dictionary<string, string[]> errors)
    {
        errors = [];

        var cleanName = RequiredText(name, nameof(name), "Product name", NameMaxLength, errors);
        var cleanSku = RequiredText(sku, nameof(sku), "SKU", SkuMaxLength, errors).ToUpperInvariant();
        var cleanDescription = OptionalText(description, nameof(description), "Description", ProductDescriptionMaxLength, errors);

        if (!string.IsNullOrWhiteSpace(cleanSku) && !SkuPattern().IsMatch(cleanSku))
        {
            AddError(errors, nameof(sku), "SKU must contain only letters, numbers, dashes, or underscores.");
        }

        if (price < 0 || price > 9999999999.99m)
        {
            AddError(errors, nameof(price), "Price must be between 0 and 9,999,999,999.99.");
        }

        if (stockQuantity < 0 || stockQuantity > 1_000_000)
        {
            AddError(errors, nameof(stockQuantity), "Stock quantity must be between 0 and 1,000,000.");
        }

        input = new SanitizedProductInput(cleanName, cleanSku, cleanDescription, price, stockQuantity, isActive);
        return errors.Count == 0;
    }

    public static bool TryRegister(
        string? firstName,
        string? lastName,
        string? email,
        string? password,
        string? role,
        out SanitizedUserInput input,
        out Dictionary<string, string[]> errors,
        bool allowAdminRole = false)
    {
        errors = [];

        var cleanFirstName = RequiredPersonName(firstName, nameof(firstName), "First name", errors);
        var cleanLastName = RequiredPersonName(lastName, nameof(lastName), "Last name", errors);
        var cleanEmail = Email(email, nameof(email), errors);
        var cleanPassword = password ?? string.Empty;
        var requestedRole = NormalizeText(role);
        var cleanRole = Roles.All.FirstOrDefault(candidate =>
            candidate.Equals(requestedRole, StringComparison.OrdinalIgnoreCase));

        if (string.IsNullOrWhiteSpace(requestedRole))
        {
            AddError(errors, nameof(role), "Role is required.");
            cleanRole = Roles.Staff;
        }
        else if (cleanRole is null)
        {
            AddError(errors, nameof(role), "Role is invalid.");
            cleanRole = Roles.Staff;
        }
        else if (cleanRole == Roles.Admin && !allowAdminRole)
        {
            AddError(errors, nameof(role), "Admin users must be created from an authorized admin workflow.");
            cleanRole = Roles.Staff;
        }

        ValidatePassword(cleanPassword, nameof(password), errors);

        input = new SanitizedUserInput(cleanFirstName, cleanLastName, cleanEmail, cleanPassword, cleanRole);
        return errors.Count == 0;
    }

    public static bool TryLogin(
        string? email,
        string? password,
        out SanitizedLoginInput input,
        out Dictionary<string, string[]> errors)
    {
        errors = [];

        var cleanEmail = Email(email, nameof(email), errors);
        var cleanPassword = password ?? string.Empty;

        if (string.IsNullOrWhiteSpace(cleanPassword))
        {
            AddError(errors, nameof(password), "Password is required.");
        }

        input = new SanitizedLoginInput(cleanEmail, cleanPassword);
        return errors.Count == 0;
    }

    public static bool TryProfile(
        string? firstName,
        string? lastName,
        out SanitizedProfileInput input,
        out Dictionary<string, string[]> errors)
    {
        errors = [];

        var cleanFirstName = RequiredPersonName(firstName, nameof(firstName), "First name", errors);
        var cleanLastName = RequiredPersonName(lastName, nameof(lastName), "Last name", errors);

        input = new SanitizedProfileInput(cleanFirstName, cleanLastName);
        return errors.Count == 0;
    }

    public static bool TrySearch(
        string? search,
        out SanitizedSearchInput input,
        out Dictionary<string, string[]> errors)
    {
        errors = [];

        var clean = OptionalText(search, nameof(search), "Search", SearchMaxLength, errors);
        input = new SanitizedSearchInput(clean);
        return errors.Count == 0;
    }

    public static bool TryIdempotencyKey(
        string? idempotencyKey,
        out string? cleanIdempotencyKey,
        out Dictionary<string, string[]> errors)
    {
        errors = [];
        cleanIdempotencyKey = OptionalText(idempotencyKey, nameof(idempotencyKey), "Idempotency key", IdempotencyKeyMaxLength, errors);

        if (!string.IsNullOrWhiteSpace(cleanIdempotencyKey) && !SafeTokenPattern().IsMatch(cleanIdempotencyKey))
        {
            AddError(errors, nameof(idempotencyKey), "Idempotency key contains invalid characters.");
        }

        return errors.Count == 0;
    }

    public static bool TryPaymentReference(
        string? paymentReference,
        out string? cleanPaymentReference,
        out Dictionary<string, string[]> errors)
    {
        errors = [];
        cleanPaymentReference = OptionalText(paymentReference, nameof(paymentReference), "Payment reference", PaymentReferenceMaxLength, errors);

        if (!string.IsNullOrWhiteSpace(cleanPaymentReference) && !SafeTokenPattern().IsMatch(cleanPaymentReference))
        {
            AddError(errors, nameof(paymentReference), "Payment reference contains invalid characters.");
        }

        return errors.Count == 0;
    }

    private static string RequiredPersonName(
        string? value,
        string field,
        string label,
        Dictionary<string, string[]> errors)
    {
        var clean = RequiredText(value, field, label, PersonNameMaxLength, errors);

        if (!string.IsNullOrWhiteSpace(clean) && !PersonNamePattern().IsMatch(clean))
        {
            AddError(errors, field, $"{label} can only contain letters, spaces, apostrophes, hyphens, and periods.");
        }

        return clean;
    }

    private static string RequiredText(
        string? value,
        string field,
        string label,
        int maxLength,
        Dictionary<string, string[]> errors)
    {
        var clean = NormalizeText(value);

        if (string.IsNullOrWhiteSpace(clean))
        {
            AddError(errors, field, $"{label} is required.");
            return string.Empty;
        }

        AddTextErrors(field, label, clean, maxLength, errors);
        return clean;
    }

    private static string? OptionalText(
        string? value,
        string field,
        string label,
        int maxLength,
        Dictionary<string, string[]> errors,
        bool preserveLineBreaks = false)
    {
        var clean = NormalizeText(value, preserveLineBreaks);

        if (string.IsNullOrWhiteSpace(clean))
        {
            return null;
        }

        AddTextErrors(field, label, clean, maxLength, errors);
        return clean;
    }

    private static string Email(
        string? value,
        string field,
        Dictionary<string, string[]> errors)
    {
        var clean = NormalizeText(value).ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(clean))
        {
            AddError(errors, field, "Email is required.");
            return string.Empty;
        }

        AddTextErrors(field, "Email", clean, EmailMaxLength, errors);

        if (clean.Contains('<') || clean.Contains('>'))
        {
            AddError(errors, field, "Email must not include a display name.");
            return clean;
        }

        try
        {
            var address = new MailAddress(clean);

            if (!string.Equals(address.Address, clean, StringComparison.OrdinalIgnoreCase))
            {
                AddError(errors, field, "Email must be a valid email address.");
            }
        }
        catch (FormatException)
        {
            AddError(errors, field, "Email must be a valid email address.");
        }

        if (!EmailPattern().IsMatch(clean))
        {
            AddError(errors, field, "Email must include a valid domain.");
        }

        return clean;
    }

    private static void ValidatePassword(
        string password,
        string field,
        Dictionary<string, string[]> errors)
    {
        if (password.Length is < PasswordMinLength or > PasswordMaxLength)
        {
            AddError(errors, field, $"Password must be between {PasswordMinLength} and {PasswordMaxLength} characters.");
        }

        if (!password.Any(char.IsUpper))
        {
            AddError(errors, field, "Password must contain at least one uppercase letter.");
        }

        if (!password.Any(char.IsLower))
        {
            AddError(errors, field, "Password must contain at least one lowercase letter.");
        }

        if (!password.Any(char.IsDigit))
        {
            AddError(errors, field, "Password must contain at least one number.");
        }
    }

    private static void AddTextErrors(
        string field,
        string label,
        string value,
        int maxLength,
        Dictionary<string, string[]> errors)
    {
        if (value.Length > maxLength)
        {
            AddError(errors, field, $"{label} must be {maxLength} characters or fewer.");
        }

        if (UnsafeTextPattern().IsMatch(value))
        {
            AddError(errors, field, $"{label} cannot contain HTML, scripts, or URL script protocols.");
        }
    }

    private static string NormalizeText(string? value, bool preserveLineBreaks = false)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var withoutControls = ControlCharacters().Replace(value.Trim(), preserveLineBreaks ? "\n" : " ");

        if (!preserveLineBreaks)
        {
            return Whitespace().Replace(withoutControls, " ").Trim();
        }

        var normalizedLines = MultiLineWhitespace()
            .Replace(withoutControls.Replace("\r\n", "\n").Replace('\r', '\n'), "\n")
            .Split('\n')
            .Select(line => Whitespace().Replace(line, " ").Trim())
            .Where(line => line.Length > 0);

        return string.Join('\n', normalizedLines);
    }

    private static void AddError(
        Dictionary<string, string[]> errors,
        string field,
        string message)
    {
        errors[field] = errors.TryGetValue(field, out var existing)
            ? [.. existing, message]
            : [message];
    }

    [GeneratedRegex(@"[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]", RegexOptions.CultureInvariant)]
    private static partial Regex ControlCharacters();

    [GeneratedRegex(@"\s+", RegexOptions.CultureInvariant)]
    private static partial Regex Whitespace();

    [GeneratedRegex(@"[ \t]*\r?\n[ \t]*", RegexOptions.CultureInvariant)]
    private static partial Regex MultiLineWhitespace();

    [GeneratedRegex(@"<|>|&lt;|&gt;|javascript:|vbscript:|data:text/html|on\w+\s*=", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex UnsafeTextPattern();

    [GeneratedRegex(@"^\+?[0-9][0-9\s().-]{6,49}$", RegexOptions.CultureInvariant)]
    private static partial Regex PhonePattern();

    [GeneratedRegex(@"^[A-Z0-9_-]{1,80}$", RegexOptions.CultureInvariant)]
    private static partial Regex SkuPattern();

    [GeneratedRegex(@"^[\p{L} .'-]+$", RegexOptions.CultureInvariant)]
    private static partial Regex PersonNamePattern();

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.CultureInvariant)]
    private static partial Regex EmailPattern();

    [GeneratedRegex(@"^[A-Za-z0-9_.:-]+$", RegexOptions.CultureInvariant)]
    private static partial Regex SafeTokenPattern();
}
