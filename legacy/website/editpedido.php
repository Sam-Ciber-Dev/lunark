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

// Validate input data
if (!is_numeric($id)) {
    echo "ID do pedido inválido.";
    exit();
}

// Retrieve cart data from the database using prepared statement
$sql = "SELECT * FROM cart WHERE id=?";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo "Erro na preparação da consulta: " . $conn->error;
    exit();
}
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();
if (!$result) {
    echo "Erro ao executar a consulta: " . $stmt->error;
    exit();
}

if ($result->num_rows == 1) {
    // Get cart data
    $row = $result->fetch_assoc();
    $imagem = $row["imagem"];
    $produto = $row["produto"];
    $preco = $row["preco"];
    $quantidade = $row["quantidade"];
    $total = $row["total"];
    $tamanho = $row["tamanho"];
    $id_utilizador = $row["id_utilizador"];
} else {
    echo "Pedido não encontrado.";
    exit();
}

// Close prepared statement
$stmt->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editar Pedido</title>
    <style>
    form, table {
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

form label {
    font-weight: bold;
    margin-bottom: 5px;
    display: block;
}

form input[type="text"],
form input[type="file"] {
    width: calc(100% - 22px);
    padding: 10px;
    margin: 5px 0;
    border: 1px solid #ccc;
    border-radius: 4px;
}

form input[type="submit"],
form button[type="button"] {
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 20px;
    margin-top: 10px;
    cursor: pointer;
}

form input[type="submit"]:hover,
form button[type="button"]:hover {
    background-color: #45a049;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
}

table th, table td {
    padding: 10px;
    border-bottom: 1px solid #ddd;
}

table th {
    text-align: left;
    background-color: #f2f2f2;
}
    </style>
</head>
<body>
    <h2>Editar Pedido</h2>
    <form id="update_form" action="updatepedido.php" method="post">
    <input type="hidden" name="id" value="<?php echo $id; ?>">
    <table>
        <tr>
            <td><label for="imagem">Imagem:</label></td>
            <td><img src="img/<?php echo $imagem; ?>" alt="Imagem do Pedido" width="100"></td>
        </tr>
        <tr>
            <td><label for="produto">Produto:</label></td>
            <td><input type="text" id="produto" name="produto" value="<?php echo $produto; ?>" readonly></td>
        </tr>
        <tr>
            <td><label for="preco">Preço:</label></td>
            <td><input type="text" id="preco" name="preco" value="<?php echo $preco; ?>" readonly></td>
        </tr>
        <tr>
            <td><label for="quantidade">Quantidade:</label></td>
            <td><input type="text" id="quantidade" name="quantidade" value="<?php echo $quantidade; ?>" onchange="calcularTotal()"></td>
        </tr>
        <tr>
            <td><label for="total">Total:</label></td>
            <td><input type="text" id="total" name="total" value="<?php echo $total; ?>" readonly></td>
        </tr>
        <tr>
            <td><label for="tamanho">Tamanho:</label></td>
            <td><input type="text" id="tamanho" name="tamanho" value="<?php echo $tamanho; ?>"></td>
        </tr>
        <tr>
            <td><label for="id_utilizador">ID Utilizador:</label></td>
            <td><input type="text" id="id_utilizador" name="id_utilizador" value="<?php echo $id_utilizador; ?>" readonly></td>
        </tr>
    </table>
    <button type="button" onclick="submitForm()">Atualizar</button>
    <a href="visualizarpedidos.php"><button type="button">Cancelar Alterações</button></a>
</form>


<script>
    function calcularTotal() {
        var precoUnitario = parseFloat(document.getElementById("preco").value);
        var quantidade = parseInt(document.getElementById("quantidade").value);
        var novoTotal = precoUnitario * quantidade;
        document.getElementById("total").value = novoTotal.toFixed(2);
    }

    function submitForm() {
        var form = document.getElementById("update_form");
        form.submit();
    }
</script>
</body>
</html>
