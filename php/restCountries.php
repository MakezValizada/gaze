<?php

$url = 'https://restcountries.com/v2/alpha/' . $_REQUEST['country'];

$executionStartTime = microtime(true) / 1000;


$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);

curl_close($ch);

$decode = json_decode($result, true);

$output['status']['code'] = "200";
$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
$output['status']['name'] = "ok";
$output['status']['description'] = "mission saved";
$output['name'] = $decode["name"];
$output['callingCodes'] = $decode["callingCodes"][0];
$output['currency'] = $decode["currencies"][0];
$output['capital'] = $decode["capital"];
$output['population'] = $decode["population"];
$output['language'] = $decode["languages"][0];


header('Content-Type: application/json; charset=UTF-8');

echo json_encode($output);
