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

// Retrieve distinct user IDs from the database
$sql = "SELECT DISTINCT id_utilizador FROM cart";
$result = $conn->query($sql);

?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styleadmin.css">
    <link rel="stylesheet" type="text/css" href="main.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap" rel="stylesheet">
    <title>Pedidos por Usuário</title>
    
    <style>
        /* Estilos para o menu */
        .navigation {
            background-color: #333;
            width: 100%;
            padding: 15px 0;
            text-align: center;
        }

        .mainmenu {
            list-style-type: none;
            margin: 0;
            padding: 0;
            display: inline-block;
        }

        .mainmenu li {
            display: inline-block;
            margin-right: 20px;
        }

        .mainmenu li a {
            color: #fff;
            text-decoration: none;
            font-size: 18px;
            padding: 10px 20px;
            transition: background-color 0.3s;
        }

        .mainmenu li a:hover {
            background-color: #555;
        }

        .submenu {
            display: none;
            position: absolute;
            background-color: #333;
            z-index: 1;
            width: 200px;
        }

        .submenu li {
            display: block;
        }

        .submenu li a {
            color: #fff;
            text-decoration: none;
            padding: 10px;
            display: block;
        }

        .mainmenu li:hover .submenu {
            display: block;
        }

        /* Adicionando o CSS diretamente aqui */
        .admin-info {
            background-color: #f0f0f0;
            padding: 20px;
            border-radius: 5px;
            margin-top: 20px;
        }

        .admin-info h2 {
            color: #333;
            font-size: 24px;
            margin-bottom: 10px;
        }

        .admin-info p {
            color: #555;
            font-size: 16px;
            margin-bottom: 5px;
        }

        .admin-info p:last-child {
            margin-bottom: 0;
        }

        /* Estilo suave para a tabela de pedidos */
        table {
            width: 100%;
            border-collapse: collapse;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

        table td img {
            max-width: 100px;
            max-height: 100px;
        }

        table td a {
            text-decoration: none;
            color: #007bff;
        }

        table td a:hover {
            text-decoration: underline;
            color: #0056b3;
        }

        .user-details {
            background-color: #f0f0f0;
            padding: 20px;
            border-radius: 5px;
            margin-top: 20px;
        }

        .user-details p {
            color: #333;
            font-size: 16px;
            margin-bottom: 10px;
        }

        .user-details p:last-child {
            margin-bottom: 0;
        }
    </style>

</head>
<body>
    
    <!-- Menu section -->
    <section>
        <div class="navigation">
            <ul class="mainmenu">
                <li><a href="admin.php"><img src="img/logo.png" width="90" height="95" class="logo" alt=""></a></li>
                <li><a href="">Produtos</a>
                    <ul class="submenu">
                        <li><a href="adproduto.php">Adicionar</a></li>
                        <li><a href="atualizarproduto.php">Atualizar</a></li>
                    </ul>
                </li>
                <li><a href="">Pedidos</a>
                    <ul class="submenu">
                        <li><a href="visualizarpedidos.php">Visualizar pedidos</a></li>
                    </ul>
                </li>
                <li><a href="">Contas</a>
                    <ul class="submenu">
                        <li><a href="contas.php">Gerir contas</a></li>
                    </ul>
                </li>
                <li><a href="logout.php">Logout</a></li>
            </ul>
        </div>
        <br>
    </section>
    <!-- End of Menu section -->

<?php
// Database connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $user_id = $row["id_utilizador"];
        $total_user_order = 0; // Inicialize o total dos pedidos do usuário
        
        // Retrieve orders with the current user ID
        $order_sql = "SELECT * FROM cart WHERE id_utilizador = $user_id";
        $order_result = $conn->query($order_sql);

        // Calcular o total dos pedidos do usuário
        while($order = $order_result->fetch_assoc()) {
            $total_user_order += $order["total"];
        }

        // Retrieve user details from 'users' table
        $user_sql = "SELECT id, nome, email FROM users WHERE id = $user_id";
        $user_result = $conn->query($user_sql);
        if ($user_result) {
            $user_row = $user_result->fetch_assoc();
            if ($user_row) {
                $user_id = $user_row["id"]; // Updated to retrieve user ID from 'users' table
                $user_name = $user_row["nome"];
                $user_email = $user_row["email"];

                // Display user details
                echo "<div class='user-details'>";
                echo "<br>";
                echo "<p><strong>ID:</strong> $user_id</p>"; // Displaying user ID
                if (isset($user_name)) {
                    echo "<p><strong>Nome:</strong> $user_name</p>";
                }
                if (isset($user_email)) {
                    echo "<p><strong>Email:</strong> $user_email</p>";
                }
                 // Exibir o total dos pedidos do usuário antes do email
                if (isset($total_user_order)) {
                 echo "<p><strong>Valor total dos pedidos:</strong> $total_user_order €</p>";
                }

                // Consulta SQL para obter os dados de localização do usuário atual
                $localizacao_sql = "SELECT destrito, conselho, codigopostal FROM localizacao WHERE id_utilizador = $user_id";
                $localizacao_result = $conn->query($localizacao_sql);

                // Verificar se existem dados de localização para exibir
                if ($localizacao_result->num_rows > 0) {
                    echo "<div class='user-details'>";
                    echo "<h4>Dados de Localização</h4>";
                    // Exibir os dados de localização
                    while ($localizacao_row = $localizacao_result->fetch_assoc()) {
                        echo "<p><strong>Distrito:</strong> " . $localizacao_row['destrito'] . "</p>";
                        echo "<p><strong>Conselho:</strong> " . $localizacao_row['conselho'] . "</p>";
                        echo "<p><strong>Código Postal:</strong> " . $localizacao_row['codigopostal'] . "</p>";
                    }
                    echo "</div>";
                } else {
                    echo "<p>Nenhuma informação de localização encontrada.</p>";
                }
                echo "</div>";
            } else {
                echo "Nenhum usuário encontrado para o ID: $user_id.";
            }
        } else {
            echo "Erro ao recuperar detalhes do usuário.";
        }

        // Restante do código


        echo "<table>";
        echo "<tr>
                <th>ID</th>
                <th>Imagem</th>
                <th>Produto</th>
                <th>Preço</th>
                <th>Quantidade</th>
                <th>Total</th>
                <th>Tamanho</th>
                <th>Editar</th>
                <th>Apagar</th>
            </tr>";
    
        // Retrieve orders with the current user ID
        $order_sql = "SELECT * FROM cart WHERE id_utilizador = $user_id";
        $order_result = $conn->query($order_sql);

        if ($order_result->num_rows > 0) {
            $total_user_order = 0; // Initialize total order amount for the user
            while($order = $order_result->fetch_assoc()) {
                echo "<tr>";
                echo "<td>" . $order["id"] . "</td>";
                echo "<td><img src='img/" . $order["imagem"] . "?t=" . time() . "' width='50'></td>";
                echo "<td>" . $order["produto"] . "</td>";
                echo "<td>" . $order["preco"] . "€</td>";
                echo "<td>" . $order["quantidade"] . "</td>";
                echo "<td>" . $order["total"] . "€</td>";
                echo "<td>" . $order["tamanho"] . "</td>";
                echo "<td><a href='editpedido.php?id=" . $order["id"] . "'>Editar</a></td>";
                echo "<td><a href='deletepedido.php?id=" . $order["id"] . "'>Apagar</a></td>";
                echo "</tr>";
                // Adicionar o total do pedido ao total do usuário
                $total_user_order += $order["total"];
            }
            echo "</table>";
            
            echo "<br>";
            echo "</div>";
        } else {
            echo "Nenhum pedido encontrado para o usuário com ID: $user_id.";
        }
    }
} else {
    echo "Nenhum usuário encontrado.";
}

// Fechar conexão
$conn->close();
?>
</body>
</html>
