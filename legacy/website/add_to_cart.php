<?php
session_start();

// Check if the user is logged in
if (!isset($_SESSION['id'])) {
    // If not logged in, redirect to the login page or display an error message
    echo "Usuário não autenticado.";
    exit();
}

// Verificar se os dados do produto estão sendo enviados via POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Conexão com o banco de dados
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "ecomerce";

    // Criar conexão
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Verificar conexão
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    // Preparar a declaração SQL para inserir os detalhes do produto no carrinho
    $stmt = $conn->prepare("INSERT INTO cart (imagem, produto, preco, tamanho, quantidade, total, id_utilizador) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssdsiii", $imagem, $produto, $preco, $tamanho, $quantidade, $total, $_SESSION['id']);

    // Atribuir valores às variáveis
    $imagem = $_POST['imagem'];
    $produto = $_POST['produto'];
    $preco = $_POST['preco'];
    $tamanho = $_POST['tamanho']; // Agora estamos capturando o tamanho do produto
    $quantidade = $_POST['quantidade'];
    $total = $preco * $quantidade;

    // Executar a declaração SQL
    if ($stmt->execute()) {
        echo "Produto adicionado ao carrinho com sucesso.";
        echo "<script>window.location.href = 'cart.php';</script>";
    } else {
        echo "Erro ao adicionar o produto ao carrinho: " . $conn->error;
    }

    // Fechar a declaração e a conexão
    $stmt->close();
    $conn->close();
} else {
    echo "Método não permitido.";
}
?>
