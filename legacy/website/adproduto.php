<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styleadmin.css">
    <link rel="stylesheet" href="adproduto.css">
    <link rel="stylesheet" type="text/css" href="main.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&display=swap" rel="stylesheet">
    <style>
        /* Estilo suave para o formulário */
form {
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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



        /* Definindo o tamanho das imagens */
        .imagem {
            width: 200px; /* Defina o tamanho desejado */
            height: auto; /* Isso mantém a proporção da imagem */
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

    <!-- adproduto section -->
    <section>
        <h2>Formulário de Inserção de Dados de Roupa</h2>
        <form action="adproduto.php" method="post">
            <label for="modelo">Modelo:</label><br>
            <input type="text" id="modelo" name="modelo"><br>
            <label for="preco">Preço:</label><br>
            <input type="text" id="preco" name="preco"><br>
            <label for="imagem">Imagem:</label><br>
            <input type="file" id="imagem" name="imagem"><br><br>
            <input type="submit" value="Enviar">
            <a href="admin.php"><button type="button">Cancelar Alterações</button></a>
        </form>

        <?php
        // Conexão com o banco de dados
        $servername = "localhost";
        $username = "root";
        $password = ""; // sem senha
        $dbname = "ecomerce";

        // Criar conexão
        $conn = new mysqli($servername, $username, $password, $dbname);

        // Verificar conexão
        if ($conn->connect_error) {
            die("Connection failed: " . $conn->connect_error);
        }

        // Se o formulário foi enviado
        if ($_SERVER["REQUEST_METHOD"] == "POST") {
            // Pegar os dados do formulário
            $modelo = $_POST['modelo'];
            $preco = $_POST['preco'];
            $imagem = $_POST['imagem'];

            // Preparar e executar a consulta SQL para inserir dados
            $sql = "INSERT INTO roupa (modelo, preco, imagem) VALUES ('$modelo', '$preco', '$imagem')";
            if ($conn->query($sql) === TRUE) {
                echo "<p>Produto inserido com sucesso!</p>";
                // Exibir a imagem do produto
                echo "<img src='$imagem' class='imagem-produto' alt='Imagem do Produto'>";
            } else {
                echo "Erro ao inserir os dados: " . $conn->error;
            }
        }

        // Fechar conexão
        $conn->close();
        ?>
    </section>
    <!-- End of adproduto section -->
</body>
</html>
