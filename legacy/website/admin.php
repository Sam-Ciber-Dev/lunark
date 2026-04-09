<?php
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

// Consulta para obter as informações do admin
$sql = "SELECT nome, email FROM staff WHERE id = 1"; // Supondo que o id do admin seja 1
$result = $conn->query($sql);

$admin_nome = ""; // Inicialize as variáveis para evitar erros caso não haja resultados na consulta
$admin_email = "";

if ($result->num_rows > 0) {
    // Output dos dados
    $row = $result->fetch_assoc();
    $admin_nome = $row["nome"];
    $admin_email = $row["email"];
} else {
    echo "Admin não encontrado";
}

// Fechar conexão
$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styleadmin.css">
    <link rel="stylesheet" type="text/css" href="main.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap" rel="stylesheet">
    <style>
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
            <!-- Área do Admin -->
            <div class="admin-info">
            <h2>Área do Admin</h2>
            <p>Nome: <?php echo $admin_nome; ?></p>
            <p>Email: <?php echo $admin_email; ?></p>
        </div>
        <!-- End of Área do Admin -->
</body>
</html>
