# ADR 0006: Use Razor for Server Document Templates

## Context

Order invoices require a maintainable, print-oriented layout generated from persisted server data. Building PDFs directly through drawing commands mixes presentation with document orchestration. Rendering React on the server would introduce a second JavaScript rendering pipeline and couple invoices to the browser application.

## Decision

Use the ASP.NET Core Razor view engine to render invoice view models into semantic HTML. Convert the rendered HTML to PDF with PuppeteerSharp and Chromium. Keep the existing React frontend and its client-side export features unchanged.

The invoice flow is:

1. load the persisted order, customer, and items;
2. map them to `InvoiceViewModel`;
3. render `Templates/Invoices/Invoice.cshtml`;
4. convert the HTML to A4 PDF;
5. return the PDF through an authenticated endpoint.

## Consequences

- Invoice layout is isolated from endpoint and business logic.
- Dynamic values receive Razor's normal HTML encoding.
- Templates can be adjusted without rewriting PDF drawing code.
- The same HTML can be inspected independently from PDF conversion.
- API runtime environments need a compatible Chrome/Chromium executable or permission to download one.
- Chromium startup and page rendering add CPU, memory, and latency costs.
- Tests replace the browser PDF generator while exercising the real Razor template and endpoint contract.

## Alternatives Considered

- **HTML string concatenation:** rejected because escaping, conditional sections, and layout maintenance become error-prone.
- **React server rendering:** rejected because server documents should not depend on the client build or introduce Node-based rendering into the API.
- **Client-only PDF generation:** retained for existing storefront/export workflows but not selected for authenticated server invoices because client state and totals are not authoritative.
- **Direct PDF drawing library:** not selected because it would duplicate layout concerns in imperative drawing code rather than reusable HTML/CSS.
