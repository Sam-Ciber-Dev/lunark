<?php

$server = "localhost";
$username = "root";
$password = "";
$database = "ecomerce";

$mysqli = mysqli_connect($server, $username, $password, $database);

if ($mysqli->error) { 
    // Verifica se ocorreu algum erro ao conectar ao banco de dados
    die("Falha ao conectar ao banco de dados: " . $mysqli->error); 
    // Se houver um erro, exibe uma mensagem de erro e interrompe o script usando a função die().
}

?>
