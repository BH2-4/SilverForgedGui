/* Ready-made collection. The historical image archive lives in data.js. */
const CATALOG_PRODUCTS = [
    {
        sku: 'RM-001',
        name: 'Royal blue embroidered butterfly tassel earrings',
        category: 'Earrings',
        material: 'Electroplated alloy with copper ear posts',
        price: 12,
        unit: 'pair',
        img: 'assets/images/ready-made/butterfly-blue.jpg',
    },
    {
        sku: 'RM-002',
        name: 'Miao-inspired wide silver-tone open cuff',
        category: 'Bracelets',
        material: 'Electroplated alloy',
        price: 19.90,
        unit: 'piece',
        img: 'assets/images/ready-made/open-cuff.jpg',
    },
    {
        sku: 'RM-003',
        name: 'Natural-finish filigree earrings with long tassels',
        category: 'Earrings',
        material: 'Supplier-listed fine silver · Guizhou, China',
        price: 79,
        unit: 'pair',
        img: 'assets/images/ready-made/filigree-earrings.jpg',
    },
    {
        sku: 'RM-004',
        name: 'Silver-tone butterfly and floral fringe collar',
        category: 'Necklaces',
        material: 'Electroplated alloy',
        price: 29.90,
        unit: 'piece',
        img: 'assets/images/ready-made/butterfly-floral-collar.jpg',
    },
    {
        sku: 'RM-005',
        name: 'Silver-tone engraved floral fringe necklace',
        category: 'Necklaces',
        material: 'Electroplated alloy',
        price: 24.90,
        unit: 'piece',
        img: 'assets/images/ready-made/engraved-floral-fringe-necklace.jpg',
    },
    {
        sku: 'RM-006',
        name: 'Oval drum-motif link bracelet',
        category: 'Bracelets',
        material: 'Supplier-listed fine silver',
        price: 119,
        unit: 'piece',
        img: 'assets/images/ready-made/oval-drum-link-bracelet.jpg',
    },
];

const CATALOG_PRICE_NOTE = 'Indicative prices for France. Delivery is quoted separately.';
const catalogCurrency = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

function catalogProduct(sku) {
    return CATALOG_PRODUCTS.find(function (product) { return product.sku === sku; });
}

function catalogPrice(product) {
    return catalogCurrency.format(product.price) + ' / ' + product.unit;
}

function catalogCard(product, showInquiry) {
    var base = window.ASSET_BASE || '';
    return '<article class="plate">' +
        '<a href="' + base + 'products/detail.html?sku=' + product.sku + '" class="block">' +
        '<div class="img-frame aspect-square m-3 flex items-center justify-center overflow-hidden">' +
        '<img src="' + base + product.img + '" alt="' + product.name + '" class="w-full h-full object-contain p-4" loading="lazy" /></div>' +
        '<div class="px-4 pb-4">' +
        '<p class="text-sm font-semibold" style="color:var(--silver-bright)">' + product.name + '</p>' +
        '<p class="text-sm mt-2" style="color:var(--silver)">' + catalogPrice(product) + '</p>' +
        '</div></a>' +
        (showInquiry ? '<button data-inquiry-add="' + product.sku + '" class="px-4 pb-5 text-xs tracking-widest uppercase font-semibold" style="color:var(--muted)">+ Inquiry</button>' : '') +
        '</article>';
}
