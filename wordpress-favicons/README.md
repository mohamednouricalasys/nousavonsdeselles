# Favicon Package - Nous Avons Des Elles

## Files Included

| File | Size | Purpose |
|------|------|---------|
| `favicon.svg` | Scalable | Modern browsers, primary favicon |
| `favicon.ico` | 32×32 | Legacy browsers |
| `favicon-16x16.png` | 16×16 | Browser tabs |
| `favicon-32x32.png` | 32×32 | Browser tabs (high-DPI) |
| `favicon-48x48.png` | 48×48 | Windows tiles |
| `apple-touch-icon.png` | 180×180 | iOS home screen |
| `android-chrome-192x192.png` | 192×192 | Android home screen |
| `android-chrome-512x512.png` | 512×512 | Android splash screen |
| `icon-192.png` | 192×192 | PWA icon |
| `icon-512.png` | 512×512 | PWA icon |
| `icon-192.webp` | 192×192 | PWA icon (WebP) |
| `icon-512.webp` | 512×512 | PWA icon (WebP) |
| `site.webmanifest` | - | Web App Manifest |

## WordPress Integration

### Option 1: WordPress Site Icon (Recommended)

1. Go to **WordPress Admin → Appearance → Customize → Site Identity**
2. Click **Select Site Icon**
3. Upload `icon-512.png` (512×512)
4. WordPress will automatically generate the required sizes

### Option 2: Manual Upload via FTP/SFTP

1. Upload all favicon files to the WordPress root directory (same level as `wp-config.php`)
2. Upload `site.webmanifest` to the same location
3. Add the following to your theme's `functions.php` or use a plugin like "Insert Headers and Footers":

```php
function custom_favicon_links() {
    echo '<link rel="icon" type="image/svg+xml" href="/favicon.svg">';
    echo '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">';
    echo '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">';
    echo '<link rel="shortcut icon" href="/favicon.ico">';
    echo '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">';
    echo '<link rel="manifest" href="/site.webmanifest">';
    echo '<meta name="theme-color" content="#6b9670">';
    echo '<meta name="msapplication-TileColor" content="#6b9670">';
}
add_action('wp_head', 'custom_favicon_links', 1);
```

### Option 3: Using a Plugin

1. Install **RealFaviconGenerator** or **Favicon by RealFaviconGenerator** plugin
2. Upload the favicon package through the plugin interface
3. The plugin will handle all HTML head declarations automatically

## Brand Colors

- **Primary (Sage Green):** `#6b9670`
- **Accent (Coral):** `#ec8d70`
- **Background (Cream):** `#fbf4eb`
- **Theme Color:** `#6b9670`

## Verification

After installation, verify the favicon displays correctly:

1. Clear browser cache
2. Visit the website in multiple browsers (Chrome, Firefox, Safari, Edge)
3. Test on mobile devices (iOS Safari, Android Chrome)
4. Use [realfavicongenerator.net/favicon_checker](https://realfavicongenerator.net/favicon_checker) to validate

## Design Notes

The favicon uses the "Nous Avons Des Elles" brand symbol:
- **Overlapping heart/pin shapes** representing solidarity and location
- **Coral heart** (background) representing warmth and community
- **Sage green pin** (foreground) representing growth and stability
- **Small leaf** representing sustainability and eco-responsibility
- **Cream background** with rounded corners for modern appearance
