<?php
session_start();

// Verificar se o usuário está autenticado
if (!isset($_SESSION['id'])) {
    // Se não estiver autenticado, redirecionar para a página de login
    header("Location: login.php");
    exit;
}

// Obter os dados do formulário
$destrito = $_POST['destrito']; // Variável corrigida
$conselho = $_POST['conselho'];
$codigopostal = $_POST['codigopostal'];
$id_utilizador = $_SESSION['id'];

// Conectar ao banco de dados
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "ecomerce";
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexão
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Inserir os dados de localização na tabela "localizacao"
$sql = "INSERT INTO localizacao (destrito, conselho, codigopostal, id_utilizador) VALUES ('$destrito', '$conselho', '$codigopostal', '$id_utilizador')";
if ($conn->query($sql) === TRUE) {
    // Armazenar os dados na sessão
    $_SESSION['localizacao'] = array(
        'distrito' => $destrito,
        'conselho' => $conselho,
        'codigopostal' => $codigopostal
    );

    // Redirecionar para a página de perfil após inserir os dados
    header("Location: perfil.php");
    exit;
} 
else {
    echo "Erro ao inserir dados de localização: " . $conn->error;
}

// Fechar conexão
$conn->close();
?>
