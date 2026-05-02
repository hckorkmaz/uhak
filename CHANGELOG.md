# UHAK CHANGELOG

## v1.0.1

## Genel bakış

v1.0.1, oynanış akışını daha kararlı hale getiren ve görsel engel tasarımlarını iyileştiren bakım sürümüdür.

## Öne çıkan yenilikler

- Seviye geçişinde skor sıfırlama akışı düzeltildi; Seviye 1 sonrası Seviye 2'nin anında tamamlanması giderildi
- Serbest mod zorluk davranışı sabitlendi; skor arttıkça otomatik zorluk değişimi kapatıldı
- Bulut üretiminde üst sınır taşması engellendi; engeller artık ekranın üstüne çıkmıyor
- Seviye 1 bulut aralığı genişletilerek başlangıç deneyimi kolaylaştırıldı
- Bulut engel piksel-art tasarımı güncellendi; şimşekler bulut içinde ve daha okunabilir şekilde yeniden işlendi
- Uçak sprite tasarımı gerçek uçak silüetine daha yakın olacak şekilde rafine edildi

## Teknik içerik

- `LevelConfig` yapısına `maxGapMultiplier` parametresi eklendi ve gap tavanı seviyelerden parametrik yönetilir hale getirildi
- Çarpışma/engel üretim akışında üst sınır güvenliği artırıldı
- Görsel sprite gridleri yeniden düzenlendi ve assets yeniden üretildi

## Sürüm etiketi

- Release version: v1.0.1
- Release branch: release/v1.0.1

## v1.0.0

## Genel bakış

v1.0.0, UHAK oyununun ilk kararlı çapraz platform sürümüdür. Bu sürümle birlikte proje, Expo tabanlı tek bir React Native mimarisi altında web ve Android odaklı modern bir yapıya taşınmıştır.

## Öne çıkan yenilikler

- Expo ve React Native tabanlı birleşik uygulama yapısı
- Web ve mobilde ortak oyun mantığı
- Piksel-art temalı yenilenmiş görsel tasarım
- Uçak, bulut, arka plan ve menülerde bütünlüklü sanat yönü
- Daha dengeli engel boşlukları ve akıcı oyun temposu
- Türkçe ve İngilizce dil desteği
- Yerel skor ve ilerleme kaydı
- Android çalışma desteği ve yerel proje altyapısı

## Teknik içerik

- Expo 54
- React 19 ve React Native 0.81
- React Native Web desteği
- TypeScript tabanlı kod yapısı
- AsyncStorage ile veri kalıcılığı
- Web export ve statik dağıtım hazırlığı

## Bu sürüm kimler için

- Tarayıcıda hızlı arcade deneyimi isteyen oyuncular
- Android cihazda yerel uygulama kurulumu isteyen kullanıcılar
- Tek kod tabanından çoklu platform hedefleyen geliştirme yaklaşımı arayan ekipler

## Sürüm etiketi

- Release version: v1.0.0
- Release branch: release/v1.0.0
