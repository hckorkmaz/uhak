# UHAK: Bulutların Ötesinde

UHAK artık tek bir Expo tabanlı React Native uygulaması olarak web, Android ve iOS için çalışır.

## Mimari

- Expo ve React Native tek uygulama katmanı olarak kullanılır.
- Web desteği Expo Web üzerinden sağlanır.
- Oyun mantığı ve arayüz tek Expo uygulaması içinde tutulur.
- Platform bağımsız mantık src/game altında yer alır.

## Özellikler

- Seviyeli oyun modu
- Serbest mod ve sonsuz ilerleme
- Türkçe ve İngilizce dil desteği
- Dokunmatik odaklı doğal mobil deneyim
- Web ve mobilde ortak oyun mantığı
- Yerel depolama ile skor ve ilerleme kaydı

## Teknolojiler

- Expo
- React Native
- React Native Web
- TypeScript
- AsyncStorage

## Yerel geliştirme

Gereksinim: Node.js 18+

1. Kökten mobil geliştirme sunucusu:

   npm run dev

2. Android:

   npm run android

3. iOS:

   npm run ios

4. Web:

   npm run web

5. Tip kontrolü:

   npm run typecheck

## Proje yapısı

- src/game: oyun kuralları, tipler ve sabitler
- App.tsx: ana React Native oyun ekranı
- package.json: Expo komutları ve bağımlılıklar

## Not

Bu depo artık Vite tabanlı eski web uygulamasını değil, React Native merkezli çapraz platform uygulamayı esas alır.
