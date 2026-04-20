# UHAK: Bulutların Ötesinde

UHAK, piksel sanat estetiğiyle tasarlanmış, refleks ve zamanlama odaklı bir arcade uçuş oyunudur. Oyun artık tek bir Expo tabanlı React Native uygulaması olarak web, Android ve iOS üzerinde çalışır.

## Oyun içeriği

Oyuncu küçük bir uçağı kontrol ederek bulut engellerinin arasından geçer, çarpışmadan ilerlemeye çalışır ve en yüksek skora ulaşmayı hedefler. Deneyim, klasik arcade hissini mobil uyumlu dokunmatik kontroller ve kısa oturumlarla birleştirir.

### Temel oynanış özellikleri

- Seviyeli ilerleme sistemi
- Serbest mod ve sonsuz skor akışı
- Giderek artan zorluk dengesi
- Bulut engelleri, güvenli geçiş boşlukları ve çarpışma kontrolü
- Oyun sonu, bölüm tamamlama ve kazanma ekranları
- Türkçe ve İngilizce dil desteği
- Kayıtlı en iyi skor ve ilerleme verisi

### Tasarım yaklaşımı

- Bütünlüklü piksel-art görsel dil
- Retro hissi güçlendiren tipografi ve menü yapısı
- Mobilde hızlı tepki veren sade arayüz
- Arka plan, uçak, bulut ve oyun ekranlarında ortak sanat yönü

## Teknik yapı ve mimari

Uygulama, tek kod tabanından birden fazla platformu hedefleyen modern bir çapraz platform mimariye sahiptir.

- Expo uygulama çalışma zamanı ve araç zinciri olarak kullanılır.
- React Native, oyun arayüzü ve ekran yapısını oluşturur.
- React Native Web, aynı deneyimi tarayıcıda sunar.
- Oyun mantığı platformdan bağımsız olacak şekilde src/game altında tutulur.
- Görsel bileşenler ve sprite yapıları src/components altında ayrıştırılır.
- Kalıcı skor ve ilerleme bilgileri cihaz üzerinde saklanır.

## Kullanılan teknolojiler

### Çekirdek teknolojiler

- Expo 54
- React 19
- React Native 0.81
- React Native Web
- TypeScript

### Uygulama ve cihaz entegrasyonları

- expo-font: oyun içi yazı tiplerinin yüklenmesi
- expo-status-bar: platform uyumlu durum çubuğu yönetimi
- react-native-safe-area-context: güvenli alan desteği
- @react-native-async-storage/async-storage: skor ve ilerleme kaydı

### Görsel ve üretim araçları

- @expo-google-fonts/vt323: retro piksel yazı tipi
- @napi-rs/canvas: ikon ve görsel üretim araçları
- Expo web export: statik web çıktısı alma

## Platform desteği

- Web tarayıcıları
- Android uygulaması
- iOS uygulaması

## Yerel geliştirme

Gereksinim: Node.js 18+

1. Bağımlılıkları kur:

   npm install

2. Geliştirme sunucusunu başlat:

   npm run dev

3. Android üzerinde çalıştır:

   npm run android

4. iOS üzerinde çalıştır:

   npm run ios

5. Web sürümünü aç:

   npm run web

6. Tip kontrolü yap:

   npm run typecheck

7. Statik web çıktısı üret:

   npm run build

## Proje yapısı

- src/game: oyun kuralları, sabitler, tipler ve motor mantığı
- src/components: görsel bileşenler, sprite yapıları ve arka plan parçaları
- App.tsx: ana oyun akışı ve ekran yönetimi
- app.json: Expo yapılandırması ve platform ayarları
- tools: varlık üretimi ve web çıktı yardımcı betikleri
- package.json: komutlar ve proje bağımlılıkları

## Sürüm notları

Bu sürüm için detaylı değişiklikler CHANGELOG.md dosyasına eklenmiştir.

## Not

Bu depo artık eski Vite merkezli yapının yerine React Native odaklı tekil Expo uygulamasını esas alır.
