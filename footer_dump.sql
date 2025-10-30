-- MySQL dump 10.13  Distrib 9.3.0, for macos15.2 (arm64)
--
-- Host: localhost    Database: Footer
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `productId` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `productId` (`productId`),
  CONSTRAINT `cart_items_ibfk_83` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `cart_items_ibfk_84` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` int NOT NULL,
  `productId` int NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `productId` (`productId`),
  CONSTRAINT `comments_ibfk_83` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_84` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NOT NULL,
  `productId` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_items_productId_orderId_unique` (`orderId`,`productId`),
  KEY `productId` (`productId`),
  CONSTRAINT `order_items_ibfk_83` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `order_items_ibfk_84` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,6,1,129.99);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `status` enum('pendiente','pagado','enviado','cancelado') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,1,'pagado',129.99,'2025-10-30 08:19:46');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) NOT NULL,
  `stock` int DEFAULT '0',
  `size` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `brand` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('hombre','mujer','unisex') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `material` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `season` enum('verano','invierno','otoño','primavera') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_new` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sub_category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Zapatillas Footer','Zapatos cómodos y elegantes',70.00,10,'43','negro','Adidas','zapatos','hombre','piel','invierno',1,'2025-07-16 08:22:28','1752654148727-154039957.png',NULL),(2,'Adidas Campus','Destaca con un estilo chunky con estos tenis Campus 00s para hombre de adidas Originals. Inspiradas en la escena del hip hop en Tokio, estas zapatillas de deporte de corte ancho tienen una parte superior de piel de ante duradera y un cuello y lengüeta acolchados para un ajuste cómodo. Están colocados sobre una entresuela acolchada para una pisada suave, mientras que la suela exterior de goma Gum agrega una tracción esencial. El diseño es de color Core negro. Están rematados con el logo 3-Stripes en blanco en las paredes laterales y la marca Trefoil en la lengüeta y el talón. HQ8708\n',129.99,10,'41','azul','Adidas','zapatillas','hombre','empeine de cuero/ suela sintética','invierno',1,'2025-07-16 11:41:56','1752666116024-874055020.png',NULL),(3,'Adidas Campus','Destaca con un estilo chunky con estos tenis Campus 00s para hombre de adidas Originals. Inspiradas en la escena del hip hop en Tokio, estas zapatillas de deporte de corte ancho tienen una parte superior de piel de ante duradera y un cuello y lengüeta acolchados para un ajuste cómodo. Están colocados sobre una entresuela acolchada para una pisada suave, mientras que la suela exterior de goma Gum agrega una tracción esencial. El diseño es de color Core negro. Están rematados con el logo 3-Stripes en blanco en las paredes laterales y la marca Trefoil en la lengüeta y el talón. HQ8708\n',129.99,10,'41','gris','Adidas','zapatillas','hombre','empeine de cuero/ suela sintética','invierno',1,'2025-07-16 11:42:17','1752666137570-521330095.png',NULL),(4,'Adidas Campus','Destaca con un estilo chunky con estos tenis Campus 00s para hombre de adidas Originals. Inspiradas en la escena del hip hop en Tokio, estas zapatillas de deporte de corte ancho tienen una parte superior de piel de ante duradera y un cuello y lengüeta acolchados para un ajuste cómodo. Están colocados sobre una entresuela acolchada para una pisada suave, mientras que la suela exterior de goma Gum agrega una tracción esencial. El diseño es de color Core negro. Están rematados con el logo 3-Stripes en blanco en las paredes laterales y la marca Trefoil en la lengüeta y el talón. HQ8708\n',129.99,10,'41','marrón','Adidas','zapatillas','hombre','empeine de cuero/ suela sintética','invierno',1,'2025-07-16 11:43:20','1752666200780-806994626.png',NULL),(5,'Adidas Campus','Destaca con un estilo chunky con estos tenis Campus 00s para hombre de adidas Originals. Inspiradas en la escena del hip hop en Tokio, estas zapatillas de deporte de corte ancho tienen una parte superior de piel de ante duradera y un cuello y lengüeta acolchados para un ajuste cómodo. Están colocados sobre una entresuela acolchada para una pisada suave, mientras que la suela exterior de goma Gum agrega una tracción esencial. El diseño es de color Core negro. Están rematados con el logo 3-Stripes en blanco en las paredes laterales y la marca Trefoil en la lengüeta y el talón. HQ8708\n',129.99,10,'41','negro','Adidas','zapatillas','hombre','empeine de cuero/ suela sintética','invierno',1,'2025-07-16 11:43:39','1752666218998-942124096.png',NULL),(6,'Adidas Megaride','Nos hemos sumergido en los archivos de adidas para rescatar la zapatilla Megaride, una de nuestras siluetas de running más emblemáticas de los 2000. Esta versión fiel del modelo original luce una mediasuela con detalles metalizados que te hará destacar entre la multitud gracias a su distintivas aberturas. El empeine de malla perforada presenta un refuerzo envolvente de inspiración técnica que le confiere un estilo Y2K auténtico.',129.99,10,'43','blanco','Adidas','zapatillas','hombre','sintético','verano',1,'2025-07-16 11:45:40','1752666340312-933410384.png',NULL),(7,'Adidas Megaride','Nos hemos sumergido en los archivos de adidas para rescatar la zapatilla Megaride, una de nuestras siluetas de running más emblemáticas de los 2000. Esta versión fiel del modelo original luce una mediasuela con detalles metalizados que te hará destacar entre la multitud gracias a su distintivas aberturas. El empeine de malla perforada presenta un refuerzo envolvente de inspiración técnica que le confiere un estilo Y2K auténtico.',129.99,10,'44','celeste','Adidas','zapatillas','hombre','sintético','verano',1,'2025-07-16 11:46:10','1752666370485-440450839.png',NULL),(8,'Adidas Megaride','Nos hemos sumergido en los archivos de adidas para rescatar la zapatilla Megaride, una de nuestras siluetas de running más emblemáticas de los 2000. Esta versión fiel del modelo original luce una mediasuela con detalles metalizados que te hará destacar entre la multitud gracias a su distintivas aberturas. El empeine de malla perforada presenta un refuerzo envolvente de inspiración técnica que le confiere un estilo Y2K auténtico.',129.99,10,'44','negro','Adidas','zapatillas','hombre','sintético','verano',1,'2025-07-16 11:46:26','1752666386479-313089705.png',NULL),(9,'Adidas Adidzero','La velocidad y la distancia se unen con estas zapatillas para mujer Adizero Evo SL de adidas. En una combinación de colores Rosa Lúcido, estas zapatillas de running tienen una mezcla de Mesh transpirable y piel sintética en la parte superior para un uso ligero pero duradero. Incorporan un forro textil y el clásico cierre de cordones. Bajo el pie, la entresuela de espuma Lightstrike Pro proporciona una comodidad y un rendimiento inspirados en la competición, con una caída del talón a la punta de 6 mm. Llevan un parche Continental Rubbber en el antepié para un agarre excepcional, y están acabadas con 3-Stripes negras y el Logo Performance. | JS4455',129.99,10,'36','rosa','Adidas','zapatillas','mujer','sintético','verano',1,'2025-07-16 11:49:25','1752666565846-286939909.png',NULL),(10,'Adidas Munchen','Una zapatilla de ante de caña baja con un aire vintage.\nBautizada con el nombre de la tercera ciudad más grande de Alemania, esta zapatilla captura el encanto y la energía vibrante de Múnich. Presenta un empeine de ante prémium en suaves tonos pastel y una lengüeta de color crudo que le infunde un toque vintage.',129.99,10,'35','rosa','Adidas','zapatillas','mujer','cuero sintético','verano',1,'2025-07-16 11:51:15','1752666675284-161967062.png',NULL),(11,'Adidas Munchen','Luce unas deportivas de inspiración retro con estas zapatillas para mujer Handball Spezial de adidas Originals. En una combinación de colores Wonder White, Silver Violet y Gum 5, estas zapatillas tienen una parte superior de cuero liso con una construcción en forma de T para una sensación de primera calidad. Se abrochan con cordones para mantenerte sujeto, con un cuello acolchado de corte bajo para una mayor sujeción. La entresuela acolchada ofrece una pisada suave, mientras que la suela de goma proporciona una tracción total. Acabadas con la marca adidas Originals en la lengüeta, las 3-Stripes dentadas y el logotipo dorado en los laterales.',129.99,10,'36','blanco','Adidas','zapatillas','mujer','cuero sintético','verano',1,'2025-07-16 11:52:41','1752666761307-791962703.png',NULL),(12,'Adidas Munchen','Luce unas deportivas de inspiración retro con estas zapatillas para mujer Handball Spezial de adidas Originals. En una combinación de colores Wonder White, Silver Violet y Gum 5, estas zapatillas tienen una parte superior de cuero liso con una construcción en forma de T para una sensación de primera calidad. Se abrochan con cordones para mantenerte sujeto, con un cuello acolchado de corte bajo para una mayor sujeción. La entresuela acolchada ofrece una pisada suave, mientras que la suela de goma proporciona una tracción total. Acabadas con la marca adidas Originals en la lengüeta, las 3-Stripes dentadas y el logotipo dorado en los laterales.',129.99,10,'36','burdeos','Adidas','zapatillas','mujer','cuero sintético','verano',1,'2025-07-16 11:53:05','1752666785035-768962759.png',NULL),(13,'Adidas Munchen','Luce unas deportivas de inspiración retro con estas zapatillas para mujer Handball Spezial de adidas Originals. En una combinación de colores Wonder White, Silver Violet y Gum 5, estas zapatillas tienen una parte superior de cuero liso con una construcción en forma de T para una sensación de primera calidad. Se abrochan con cordones para mantenerte sujeto, con un cuello acolchado de corte bajo para una mayor sujeción. La entresuela acolchada ofrece una pisada suave, mientras que la suela de goma proporciona una tracción total. Acabadas con la marca adidas Originals en la lengüeta, las 3-Stripes dentadas y el logotipo dorado en los laterales.',129.99,10,'34','naranja','Adidas','zapatillas','mujer','cuero sintético','verano',1,'2025-07-16 11:53:20','1752666800663-254369892.png',NULL),(14,'Adidas Munchen','Luce unas deportivas de inspiración retro con estas zapatillas para mujer Handball Spezial de adidas Originals. En una combinación de colores Wonder White, Silver Violet y Gum 5, estas zapatillas tienen una parte superior de cuero liso con una construcción en forma de T para una sensación de primera calidad. Se abrochan con cordones para mantenerte sujeto, con un cuello acolchado de corte bajo para una mayor sujeción. La entresuela acolchada ofrece una pisada suave, mientras que la suela de goma proporciona una tracción total. Acabadas con la marca adidas Originals en la lengüeta, las 3-Stripes dentadas y el logotipo dorado en los laterales.',129.99,10,'34','negro','Adidas','zapatillas','mujer','cuero sintético','verano',1,'2025-07-16 11:53:42','1752666822569-952936347.png',NULL),(15,'Adidas Samba','Nacida en los campos de fútbol, la Samba es un icono atemporal de estilo urbano. Esta zapatilla mantiene la esencia de su legado con una parte superior de piel suave y refuerzos de ante.',129.99,10,'37','blanco','Adidas','zapatillas','mujer','cuero','invierno',1,'2025-07-16 11:55:04','1752666904746-192197146.png',NULL),(16,'Adidas Samba','Nacida en los campos de fútbol, la Samba es un icono atemporal de estilo urbano. Esta zapatilla mantiene la esencia de su legado con una parte superior de piel suave y refuerzos de ante.',129.99,10,'35','leopardo','Adidas','zapatillas','mujer','cuero','invierno',1,'2025-07-16 11:55:53','1752666953052-355651689.png',NULL),(17,'Adidas Samba','Nacida en los campos de fútbol, la Samba es un icono atemporal de estilo urbano. Esta zapatilla mantiene la esencia de su legado con una parte superior de piel suave y refuerzos de ante.',129.99,10,'39','marrón','Adidas','zapatillas','mujer','cuero','invierno',1,'2025-07-16 11:56:23','1752666983072-246548335.png',NULL),(18,'Adidas Samba','Nacida en los campos de fútbol, la Samba es un icono atemporal de estilo urbano. Esta zapatilla mantiene la esencia de su legado con una parte superior de piel suave y refuerzos de ante.',129.99,10,'37','morado','Adidas','zapatillas','mujer','cuero','invierno',1,'2025-07-16 11:56:53','1752667013453-700468521.png',NULL),(19,'Adidas Samba','Nacida en los campos de fútbol, la Samba es un icono atemporal de estilo urbano. Esta zapatilla mantiene la esencia de su legado con una parte superior de piel suave y refuerzos de ante.',129.99,10,'38','negro','Adidas','zapatillas','mujer','cuero','invierno',1,'2025-07-16 11:57:26','1752667046813-400781741.png',NULL),(20,'Adidas Samba','Nacida en los campos de fútbol, la Samba es un icono atemporal de estilo urbano. Esta zapatilla mantiene la esencia de su legado con una parte superior de piel suave y refuerzos de ante.',129.99,10,'39','verde','Adidas','zapatillas','mujer','cuero','invierno',1,'2025-07-16 11:57:55','1752667075166-177182313.png',NULL),(21,'Zapatillas footer 2','Footer Brand',50.00,0,'40','rojo','Footer','','unisex','cuero','invierno',1,'2025-10-30 19:11:22','1761851482393-971432439.png',NULL),(22,'Zapatillas footer 2','Footer Brand',50.00,0,'40','rojo','Footer','','unisex','cuero','invierno',1,'2025-10-30 19:13:08','1761851588035-147207119.png',NULL),(23,'Zapatillas footer 2','Footer Brand',50.00,0,'40','rojo','Footer','','unisex','cuero','invierno',1,'2025-10-30 19:13:09','1761851589509-79535631.png',NULL);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ratings`
--

DROP TABLE IF EXISTS `ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ratings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `stars` tinyint NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ratings_user_id_product_id` (`user_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `ratings_ibfk_83` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ratings_ibfk_84` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ratings`
--

LOCK TABLES `ratings` WRITE;
/*!40000 ALTER TABLE `ratings` DISABLE KEYS */;
INSERT INTO `ratings` VALUES (1,2,3,1,NULL,'2025-07-17 08:57:08'),(2,2,5,5,NULL,'2025-07-17 08:57:15'),(3,2,7,5,NULL,'2025-07-17 08:57:26'),(4,2,1,4,NULL,'2025-07-17 10:56:08'),(5,2,4,5,NULL,'2025-07-17 10:56:41'),(6,2,6,5,NULL,'2025-07-17 10:56:46'),(7,2,8,5,NULL,'2025-07-17 10:56:50'),(8,2,9,5,NULL,'2025-07-17 10:56:52'),(9,2,10,5,NULL,'2025-07-17 10:56:53'),(10,2,11,5,NULL,'2025-07-17 10:56:55'),(11,2,12,5,NULL,'2025-07-17 10:56:56'),(12,2,13,5,NULL,'2025-07-17 10:56:57'),(13,2,14,5,NULL,'2025-07-17 10:56:58'),(14,2,15,5,NULL,'2025-07-17 10:56:59'),(15,2,16,5,NULL,'2025-07-17 10:57:02'),(16,2,17,5,NULL,'2025-07-17 10:57:03'),(17,2,18,5,NULL,'2025-07-17 10:57:05'),(18,2,19,5,NULL,'2025-07-17 10:57:07'),(19,2,20,5,NULL,'2025-07-17 10:57:09'),(20,3,20,1,NULL,'2025-07-17 11:23:35'),(21,1,20,5,NULL,'2025-07-17 11:50:27'),(22,1,19,2,NULL,'2025-07-17 12:18:15');
/*!40000 ALTER TABLE `ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','client') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'client',
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `email_18` (`email`),
  UNIQUE KEY `email_19` (`email`),
  UNIQUE KEY `email_20` (`email`),
  UNIQUE KEY `email_21` (`email`),
  UNIQUE KEY `email_22` (`email`),
  UNIQUE KEY `email_23` (`email`),
  UNIQUE KEY `email_24` (`email`),
  UNIQUE KEY `email_25` (`email`),
  UNIQUE KEY `email_26` (`email`),
  UNIQUE KEY `email_27` (`email`),
  UNIQUE KEY `email_28` (`email`),
  UNIQUE KEY `email_29` (`email`),
  UNIQUE KEY `email_30` (`email`),
  UNIQUE KEY `email_31` (`email`),
  UNIQUE KEY `email_32` (`email`),
  UNIQUE KEY `email_33` (`email`),
  UNIQUE KEY `email_34` (`email`),
  UNIQUE KEY `email_35` (`email`),
  UNIQUE KEY `email_36` (`email`),
  UNIQUE KEY `email_37` (`email`),
  UNIQUE KEY `email_38` (`email`),
  UNIQUE KEY `email_39` (`email`),
  UNIQUE KEY `email_40` (`email`),
  UNIQUE KEY `email_41` (`email`),
  UNIQUE KEY `email_42` (`email`),
  UNIQUE KEY `email_43` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admFooter','admFooter@gmail.com','$2b$10$cQ1lmB7SByF7VFA.thtgUuBChBLtxsqsW.VVJ1fIWPYfY1a8/r.Gq','admin','2025-07-16 08:08:57'),(2,'juanpe','juanpedrogomezespinosa@gmail.com','$2b$10$D0ZX1isVa.ayUzxfHmH28OEI2iMHBwrddNdbkyhQf/QFzUITLgiwu','client','2025-07-17 08:55:57'),(3,'juanpe','juanpe@example.com','$2b$10$Haz48EXBHdX8G1MVRTFZA.6ezxAh7WM31JiyjV4DV7YHnUcNyJl8O','client','2025-07-17 11:23:17'),(4,'juanpeDJ','juanpe.dj@hotmail.com','$2b$10$A55lwahQju6lhoeLiqozTO0zyf5J6zxzPhZgKCB8U650XNrWmwCFO','client','2025-07-29 11:20:28'),(7,'juanpeDJ','dj.juanpe@hotmail.com','$2b$10$D6yCG5VbgpC3Vbi9wnrzDusr.X4ZeAZjKsl4tF.MGN0842drJhLDy','client','2025-07-29 11:26:20'),(9,'jorge','jorge@1.com','$2b$10$NF1.rdSLq/UchUkZ8NaIaOdOBtvagR2MyYnaeoILYK5fyMuxh2COq','client','2025-07-30 07:13:10'),(11,'jj','12@gmail.com','$2b$10$G1QExV5Fhc6MFD0Rdncwd..Kre9NnVnVllBY5PoI7NhyZq0x3lk0q','client','2025-07-30 07:21:33'),(13,'Jose','jose@example.com','$2b$10$8tmLPVVHVH3H82ARxlhl3uhHh/xpaNOjkCaOKBiIcntB9TjLAEEyG','client','2025-07-30 07:23:53'),(14,'pac','2pac@gmail.com','$2b$10$UxaMkrY.LId.byftMUxhautF.Ea/vXK7kQnUE2AYTuKZYQQwHYdHu','client','2025-07-30 07:29:32'),(16,'dj','juanpe@hotmail.com','$2b$10$Zo9V8VyCSYR7EMHb/y2npugikKs.uLR2vNmS/z.SdgC9Oui4eWJQi','client','2025-07-30 08:18:40'),(18,'jj','jj@gmail.com','$2b$10$gWK7ocRqEJk6n7buPcXoEeUCB3Mq9/q3n9u2gZuVEgJYCLD9o5IpS','client','2025-07-30 08:19:11'),(19,'h','h@gmail.com','$2b$10$08HrmrBwhFlPCtEkIkQ8ReBBVO0JxeCIIZ7DJ3d4OxTTW7dF728Nm','client','2025-07-30 08:21:15'),(20,'Francis','fperezur@gmail.com','$2b$10$t.VVL8d0qBqeztgO/6LNjeELcZpiOAwnvCmL4wEi351yLp13y6nAi','client','2025-08-01 10:07:05'),(21,'Fani','estefaniasimon92@gmail.com','$2b$10$SpTzMZzsanrp1BGlaB2TAu3DdQD42YTwwd9gmWSAtnKkqbRd5xpIy','client','2025-08-01 14:22:24'),(22,'jj','jj@1.es','$2b$10$nIQZuqWWnxBN.v1wLQjZXOHKPWEe1QPMotkXvgK6jI7r8hqp9BUMy','client','2025-08-01 14:24:55'),(23,'Paquito','paco@hotmail.com','$2b$10$fhIRVGK3yWfMnQ3t1LwgoeDz68L99OpIdH1PnTLPRC3m.vQIyBmRm','client','2025-08-01 14:33:58'),(24,'hola12','hola12434@gmail.com','$2b$10$pskcma6NrIITsl5blvaK8eaLkoObS.AAxWbP5lfuez87qWFu/DbjC','client','2025-08-01 14:34:37'),(25,'ip','ip@po.com','$2b$10$xeVuVAjxnDmQsS3UyXRCLO.4Lo8LmnxAXAroIbiVcB1yiRq2t/gc2','client','2025-08-01 14:35:11'),(26,'Afri','africavazquez92@gmail.com','$2b$10$6RukRivbojIu1UaYjXx.IugnaV4mD4XRDLwHuW8i1ObA6..ECYcV.','client','2025-08-04 17:14:23'),(27,'Camel','camel.mc@hotmail.com','$2b$10$xJQiqdL4A6WwKxPJVZV6IuELzht49bPa2M04rMc5VgO.hcWHUJ7e2','client','2025-08-11 18:35:39'),(28,'pablo ','pabloguti007@hotmail.es','$2b$10$o/zKBNMIPSnY5JXE1inicOVbLk6OAmIGjS7c0IpYVOJKz11DVJNSS','client','2025-10-30 08:15:14'),(29,'cineva','cinevapp@gmail.com','$2b$10$sILtXpIeGOjUkJu0LBWg/ehb2KDFzdCu4lBCtznaZJFaE1ucXYGta','client','2025-10-30 08:17:00');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_backup`
--

DROP TABLE IF EXISTS `users_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_backup` (
  `id` int NOT NULL DEFAULT '0',
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','client') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'client',
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_backup`
--

LOCK TABLES `users_backup` WRITE;
/*!40000 ALTER TABLE `users_backup` DISABLE KEYS */;
INSERT INTO `users_backup` VALUES (2,'admFooter','admFooter@gmail.com','$2b$10$uDD4fiqdwYel9m73kgDQ6OjorxehhAJZ3ZnEZrdoOFGcNfgSk707u','admin','2025-06-25 12:23:48'),(3,'Juanpe','juanpedrogomezespinosa@gmail.com','$2b$10$./B1t01aoHJ2WnB8UwfcnesPizXzDO2hHA7vKTBO6ckutLBU53GEC','client','2025-06-25 10:24:41'),(4,'Admin2','adminFooter@gmail.com','$2b$10$gtHaXaMCsLHM/DhNkVLe6uhzfGud5ergO1BHc7qqxSoMaJeKpNV6S','admin','2025-06-25 10:36:15');
/*!40000 ALTER TABLE `users_backup` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-30 20:22:01
