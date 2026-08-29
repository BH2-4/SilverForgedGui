/* Inquiry list (intention cart) - localStorage based, no backend */
(function () {
    'use strict';

    var KEY = 'miao_inquiry_v1';
    var ASSET_BASE = window.ASSET_BASE || '';

    function read() {
        try {
            var v = JSON.parse(localStorage.getItem(KEY));
            return Array.isArray(v) ? v : [];
        } catch (e) { return []; }
    }
    function write(list) {
        localStorage.setItem(KEY, JSON.stringify(list));
        updateBadge();
        renderDrawer();
        document.dispatchEvent(new CustomEvent('inquiry:change', { detail: list }));
    }

    function productOf(sku) {
        if (typeof PRODUCTS === 'undefined') return null;
        for (var i = 0; i < PRODUCTS.length; i++) {
            if (PRODUCTS[i].sku === sku) return PRODUCTS[i];
        }
        return null;
    }

    var Inquiry = {
        list: read,
        count: function () { return read().length; },
        has: function (sku) { return read().indexOf(sku) !== -1; },
        add: function (sku) {
            var l = read();
            if (l.indexOf(sku) === -1) { l.push(sku); write(l); }
        },
        remove: function (sku) {
            var l = read().filter(function (s) { return s !== sku; });
            write(l);
        },
        clear: function () { write([]); }
    };
    window.Inquiry = Inquiry;

    /* badge */
    function updateBadge() {
        document.querySelectorAll('[data-inquiry-count]').forEach(function (el) {
            var n = Inquiry.count();
            el.textContent = n > 0 ? '(' + n + ')' : '';
        });
    }

    /* drawer markup - injected once per page */
    function ensureDrawer() {
        if (document.getElementById('inquiryDrawer')) return;
        var overlay = document.createElement('div');
        overlay.id = 'drawerOverlay';
        var drawer = document.createElement('aside');
        drawer.id = 'inquiryDrawer';
        drawer.innerHTML =
            '<div class="flex items-center justify-between px-6 py-5" style="border-bottom:1px solid var(--line)">' +
            '  <span class="eyebrow">Inquiry List</span>' +
            '  <button id="drawerClose" class="text-2xl leading-none" style="color:var(--muted)">&times;</button>' +
            '</div>' +
            '<div id="drawerItems" class="flex-1 overflow-y-auto"></div>' +
            '<div class="p-6" style="border-top:1px solid var(--line)">' +
            '  <a href="' + ASSET_BASE + 'contact/index.html" class="btn-silver block text-center">Submit Inquiry</a>' +
            '  <p class="text-xs mt-3 text-center" style="color:var(--faint)">No payment is taken. We reply with prices &amp; availability.</p>' +
            '</div>';
        document.body.appendChild(overlay);
        document.body.appendChild(drawer);
        overlay.addEventListener('click', closeDrawer);
        document.getElementById('drawerClose').addEventListener('click', closeDrawer);
    }

    function renderDrawer() {
        var box = document.getElementById('drawerItems');
        if (!box) return;
        var l = read();
        if (l.length === 0) {
            box.innerHTML = '<p class="text-sm px-6 py-10 text-center" style="color:var(--faint)">Your inquiry list is empty.</p>';
            return;
        }
        var html = '';
        l.forEach(function (sku) {
            var p = productOf(sku);
            if (!p) return;
            html +=
                '<div class="flex items-center gap-4 px-6 py-4" style="border-bottom:1px solid var(--line-soft)">' +
                '  <a href="' + ASSET_BASE + 'products/detail.html?sku=' + p.sku + '" class="w-16 h-16 flex-shrink-0 img-frame">' +
                '    <img src="' + ASSET_BASE + p.img + '" alt="' + p.name + '" class="w-full h-full object-contain p-1">' +
                '  </a>' +
                '  <div class="flex-1 min-w-0">' +
                '    <p class="text-sm font-semibold truncate">' + p.name + '</p>' +
                '    <p class="plate-sku mt-1">' + p.sku + '</p>' +
                '  </div>' +
                '  <button data-inquiry-remove="' + p.sku + '" class="text-xs tracking-widest uppercase" style="color:var(--faint)">Remove</button>' +
                '</div>';
        });
        box.innerHTML = html;
        box.querySelectorAll('[data-inquiry-remove]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                Inquiry.remove(btn.getAttribute('data-inquiry-remove'));
            });
        });
    }

    function openDrawer() { ensureDrawer(); renderDrawer(); document.getElementById('inquiryDrawer').classList.add('open'); document.getElementById('drawerOverlay').classList.add('open'); }
    function closeDrawer() {
        var d = document.getElementById('inquiryDrawer'); if (d) d.classList.remove('open');
        var o = document.getElementById('drawerOverlay'); if (o) o.classList.remove('open');
    }

    document.addEventListener('click', function (e) {
        var t = e.target.closest ? e.target.closest('[data-inquiry-toggle]') : null;
        if (t) { e.preventDefault(); openDrawer(); }
        var add = e.target.closest ? e.target.closest('[data-inquiry-add]') : null;
        if (add) {
            e.preventDefault();
            Inquiry.add(add.getAttribute('data-inquiry-add'));
            var label = add.querySelector('[data-inquiry-add-label]') || add;
            var original = label.textContent;
            label.textContent = 'Added ✓';
            setTimeout(function () { label.textContent = original; }, 1600);
        }
    });

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });

    document.addEventListener('DOMContentLoaded', function () {
        updateBadge();
    });
})();
