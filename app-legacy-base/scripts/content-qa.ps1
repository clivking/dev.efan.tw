param(
    [string]$BaseUrl = 'https://dev.efan.tw'
)

$ErrorActionPreference = 'Stop'

$checks = @(
    @{ Label = 'home-noindex'; Path = '/'; Markers = @('noindex', 'nofollow', 'FAQPage'); VisibleText = '' },
    @{ Label = 'location-page'; Path = '/locations/taipei-access-control'; Markers = @('FAQPage', 'BreadcrumbList'); VisibleText = '' },
    @{ Label = 'solution-page'; Path = '/solutions/taipei-office-access-control'; Markers = @('Article', 'FAQPage', 'BreadcrumbList'); VisibleText = '' },
    @{ Label = 'service-page'; Path = '/services/access-control'; Markers = @('Service', 'FAQPage', 'BreadcrumbList'); VisibleText = 'HOW WE WORK' },
    @{ Label = 'category-page'; Path = '/products/category/access-control'; Markers = @('CollectionPage', 'FAQPage', 'BreadcrumbList'); VisibleText = '' },
    @{ Label = 'product-page'; Path = '/products/soyal-ar-363-e'; Markers = @('Product', 'FAQPage', 'BreadcrumbList'); VisibleText = 'PDF' }
)

$failures = 0

foreach ($check in $checks) {
    $url = '{0}{1}' -f $BaseUrl.TrimEnd('/'), $check.Path

    try {
        $html = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content
    } catch {
        Write-Output "[FAIL] $($check.Label): request failed: $url"
        $failures++
        continue
    }

    $ok = $true

    foreach ($marker in $check.Markers) {
        if (-not $html.Contains($marker)) {
            Write-Output "[FAIL] $($check.Label): missing marker '$marker'"
            $failures++
            $ok = $false
        }
    }

    if ($check.VisibleText -and -not $html.Contains($check.VisibleText)) {
        Write-Output "[FAIL] $($check.Label): missing visible text '$($check.VisibleText)'"
        $failures++
        $ok = $false
    }

    if ($ok) {
        Write-Output "[OK] $($check.Label)"
    }
}

if ($failures -gt 0) {
    Write-Output ''
    Write-Output "content QA failed with $failures issue(s)."
    exit 1
}

Write-Output ''
Write-Output 'content QA passed.'
