<?php
// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "ecomerce";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Check if ID is provided in the URL
if (!isset($_GET["id"])) {
    echo "ID do pedido não fornecido.";
    exit();
}

$id = $_GET["id"];

// Delete cart entry from the database
$sql = "DELETE FROM cart WHERE id=$id";

if ($conn->query($sql) === TRUE) {
    echo "Pedido apagado com sucesso.";
} else {
    echo "Erro ao apagar o pedido: " . $conn->error;
}

// Close connection
$conn->close();

// Redirect back to the products page
header("Location: visualizarpedidos.php");
exit();
?>
