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
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #dddddd;
            text-align: left;
            padding: 8px;
        }
        th {
            background-color: #f2f2f2;
        }
        img {
            width: 100px;
            height: auto;
        }
               /* Estilos para o menu */
               .navigation {
            background-color: #333;
            width: 100%;
            padding: 15px 0;
            text-align: center;
        }


        /* Estilo suave para os botões */
form button[type="submit"],
form button[type="button"] {
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    margin: 0 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

form button[type="submit"]:hover,
form button[type="button"]:hover {
    background-color: #45a049;
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

    <!-- Lista de Camisolas section -->
    <section>
        <h2>Lista de Camisolas</h2>
        <table>
            <tr>
                <th>Imagem</th>
                <th>Modelo</th>
                <th>Preço</th>
                <th>Editar</th>
                <th>Eliminar</th>
            </tr>
            <?php
            // Conectar ao banco de dados
            $servername = "localhost";
            $username = "root";
            $password = "";
            $dbname = "ecomerce";

            $conexao = new mysqli($servername, $username, $password, $dbname);

            // Verificar a conexão
            if ($conexao->connect_error) {
                die("Falha na conexão: " . $conexao->connect_error);
            }

            // Consulta SQL para obter produtos
            $consultaRoupa = "SELECT * FROM roupa";
            $resultadoRoupa = $conexao->query($consultaRoupa);

            // Exibir produtos
            if ($resultadoRoupa->num_rows > 0) {
                while ($roupa = $resultadoRoupa->fetch_assoc()) {
                    echo "<tr>";
                    echo "<td><img src='img/" . $roupa['imagem'] . "' alt='imagem'></td>";
                    echo "<td>" . $roupa['modelo'] . "</td>";
                    echo "<td>€" . $roupa['preco'] . "</td>";
                    echo "<td><form method='get' action='editar.php'>
                                <input type='hidden' name='id' value='" . $roupa['id'] . "'>
                                <button type='submit' class='btn btn-primary btn-sm'>Editar</button>
                            </form></td>";
                    echo "<td><form method='post' action=''>
                                <input type='hidden' name='id' value='" . $roupa['id'] . "'>
                                <button type='submit' class='btn btn-danger btn-sm'>Eliminar</button>
                            </form></td>";
                    echo "</tr>";
                }
            } else {
                echo "<tr><td colspan='5'>Nenhuma roupa disponível.</td></tr>";
            }

            // Processar a exclusão do produto
            if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['id'])) {
                $id_produto = $_POST['id'];
                $consultaExcluir = "DELETE FROM roupa WHERE id = $id_produto";
                
                if ($conexao->query($consultaExcluir) === TRUE) {
                    echo "<script>alert('Produto excluído com sucesso!');</script>";
                    // Recarregar a página para atualizar a lista de produtos após a exclusão
                    echo "<script>window.location.href = 'atualizarproduto.php';</script>";
                } else {
                    echo "<script>alert('Erro ao excluir o produto: " . $conexao->error . "');</script>";
                }
            }

            // Fechar conexão
            $conexao->close();
            ?>
        </table>
    </section>
    <!-- End of Lista de Camisolas section -->
</body>
</html>
