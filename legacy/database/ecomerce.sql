-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Tempo de geração: 13-Mar-2024 às 14:13
-- Versão do servidor: 8.2.0
-- versão do PHP: 8.2.13

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `ecomerce`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `cart`
--

DROP TABLE IF EXISTS `cart`;
CREATE TABLE IF NOT EXISTS `cart` (
  `id` int NOT NULL AUTO_INCREMENT,
  `imagem` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `produto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `preco` decimal(65,0) NOT NULL,
  `quantidade` int NOT NULL,
  `total` int NOT NULL,
  `tamanho` varchar(255) NOT NULL,
  `id_utilizador` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Extraindo dados da tabela `cart`
--

INSERT INTO `cart` (`id`, `imagem`, `produto`, `preco`, `quantidade`, `total`, `tamanho`, `id_utilizador`) VALUES
(111, 'coat1.jpg', 'Casaco', 24, 1, 24, 'M', 14);

-- --------------------------------------------------------

--
-- Estrutura da tabela `localizacao`
--

DROP TABLE IF EXISTS `localizacao`;
CREATE TABLE IF NOT EXISTS `localizacao` (
  `id` int NOT NULL AUTO_INCREMENT,
  `destrito` varchar(255) NOT NULL,
  `conselho` varchar(255) NOT NULL,
  `codigopostal` varchar(255) NOT NULL,
  `id_utilizador` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Extraindo dados da tabela `localizacao`
--

INSERT INTO `localizacao` (`id`, `destrito`, `conselho`, `codigopostal`, `id_utilizador`) VALUES
(18, 'Porto', 'Aguiar de Sousa', '4586-345', 9),
(20, 'Porto', 'Aguiar de Sousa', '4585-123', 14),
(21, 'Porto', 'Amarante', '4600-102', 10),
(22, 'Porto', 'Amarante', '4600-345', 13);

-- --------------------------------------------------------

--
-- Estrutura da tabela `roupa`
--

DROP TABLE IF EXISTS `roupa`;
CREATE TABLE IF NOT EXISTS `roupa` (
  `id` int NOT NULL AUTO_INCREMENT,
  `modelo` varchar(255) NOT NULL,
  `preco` decimal(65,0) NOT NULL,
  `imagem` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Extraindo dados da tabela `roupa`
--

INSERT INTO `roupa` (`id`, `modelo`, `preco`, `imagem`) VALUES
(13, 'Camisa', 15, 'shirt1.jpg'),
(25, 'Sweat', 20, 'shirt2.jpg'),
(30, 'Jeans', 19, 'jeans1.jpg'),
(31, 'Casaco', 24, 'coat1.jpg');

-- --------------------------------------------------------

--
-- Estrutura da tabela `staff`
--

DROP TABLE IF EXISTS `staff`;
CREATE TABLE IF NOT EXISTS `staff` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `passe` varchar(14) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Extraindo dados da tabela `staff`
--

INSERT INTO `staff` (`id`, `nome`, `email`, `passe`) VALUES
(1, 'admin', 'admin@admin.com', 'admin');

-- --------------------------------------------------------

--
-- Estrutura da tabela `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  `senha` varchar(50) NOT NULL,
  `email` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Extraindo dados da tabela `users`
--

INSERT INTO `users` (`id`, `nome`, `senha`, `email`) VALUES
(13, 'rodrigo', '123', 'rodrigoribeiro@gmail.com'),
(10, 'Hugo', 'nogueira456', 'hugoqwe123@gmail.com'),
(9, 'Daniela', 'Dan1_123', '123dan1@gmail.com'),
(8, 'Samuel', '#_01_samuel_01_#', 'samuel435@gmail.com'),
(14, 'samuel', '123', 'samuel@gmail.com'),
(15, 'joão', '1234', 'joao123@gmail.com');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
