# UHAK: Bulutların Ötesinde

UHAK, tarayıcıda çalışan, uçak temalı, çocuk dostu bir arcade oyunudur. Oyun hem masaüstü hem de mobil cihazlarda akıcı çalışacak şekilde tasarlanmıştır.

## Özellikler

- Seviyeli oyun modu
- Serbest mod ve sonsuz ilerleme
- Türkçe ve İngilizce dil desteği
- Mobil uyumlu arayüz
- Skor ve ilerleme kaydı
- GitHub Pages ile otomatik deploy desteği

## Teknolojiler

- React
- TypeScript
- Vite
- Tailwind CSS
- Motion

## Yerel geliştirme

**Gereksinim:** Node.js 18+

1. Bağımlılıkları yükleyin:

   npm install

2. Geliştirme sunucusunu başlatın:

   npm run dev

3. Tip kontrolü çalıştırın:

   npm run lint

4. Production build alın:

   npm run build

5. Build çıktısını önizleyin:

   npm run preview

## Oynanış

- Boşluk tuşu veya ekrana dokunarak uçağı yükseltin.
- Bulutlara ve sınırlara çarpmadan ilerleyin.
- Seviyeli modda hedef skora ulaşarak yeni seviyelerin kilidini açın.
- Serbest modda mümkün olduğunca uzun süre hayatta kalın.

## Deploy

Proje, main branch üzerine gönderilen güncellemelerde otomatik olarak build alacak şekilde yapılandırılmıştır.

## Proje yapısı

- src/App.tsx: ana oyun akışı ve arayüz
- src/constants.ts: seviyeler, çeviriler ve sabitler
- src/types.ts: ortak TypeScript tipleri

## Not

Bu proje eğlenceli, hafif ve hızlı açılan bir web oyunu deneyimi sunmak için optimize edilmiştir.
