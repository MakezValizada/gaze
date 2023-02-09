<?php

ini_set('display_errors', 'On');
error_reporting(E_ALL);

$url = 'https://api.covid19api.com/summary';

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$result = curl_exec($ch);

curl_close($ch);

$decode = json_decode($result, true);


$covid = [];

for ($i = 0; $i < count($decode['Countries']); $i++) {

  if ($decode['Countries'][$i]["CountryCode"] === $_REQUEST['country']) {
    array_push($covid, $decode['Countries'][$i]['TotalConfirmed']);
    array_push($covid, $decode['Countries'][$i]['TotalDeaths']);
    array_push($covid, $decode['Countries'][$i]['TotalRecovered']);
    array_push($covid, $decode['Countries'][$i]['NewConfirmed']);
    array_push($covid, $decode['Countries'][$i]['NewDeaths']);
    array_push($covid, $decode['Countries'][$i]['NewRecovered']);
  }
};

$output['status']['code'] = "200";
$output['status']['name'] = "ok";
$output['data'] = $covid;

header('Content-Type: application/json; charset=UTF-8');

echo json_encode($output);
