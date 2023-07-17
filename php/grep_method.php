<?php
const TAG_PATH = "../csv/tag.csv";
const GEOTAG_PATH = "../csv/geotag.csv";

function getGeotag($tag)
{

  $geotag_info_list = array();

  # ファイルが定位置にない時にエラーを出す
  if (!file_exists(TAG_PATH)) {
    throw new Exception("tag file not found");
  }
  if (!file_exists(GEOTAG_PATH)) {
    throw new Exception("geotag file not found");
  }

  # tagが含まれる行(形式は"画像ID,tag")を100件抽出するためのgrepコマンド
  $tagSearch = "grep -m 100 " . '",' . $tag . '$" ' . TAG_PATH;
  # grepの実行 $tagResultに実行結果がテキストで格納されている
  $is_success = exec($tagSearch, $tagResult, $retVal);

  # grepの実行結果が正常でない場合にエラーを出す
  if (!$is_success) {
    throw new Exception($tag . "と紐づく画像ID抽出中に例外が発生しました");
  }

  # 整形のための無名関数
  $tagSplitPerComma = function ($tagLine) {
    $data = explode(",", $tagLine);
    $image_id = $data[0];
    $tag = $data[1];
    return $image_id;
  };
  # "image_id,tag"から"tag"に整形する
  $image_id_list = array_map($tagSplitPerComma, $tagResult);

  # TODO:画像IDが0件であった場合の例外処理

  # 抽出してきた画像IDの情報をgeotag.csvから抽出する
  foreach ($image_id_list as $image_id) {
    # 画像IDを含む行を一件抽出してくるgrepコマンド
    $geotagSearch = "grep -m 1 " . $image_id . " " . GEOTAG_PATH;
    # grepコマンドの実行 $geotagResultに結果が格納されている
    $is_succcess = exec($geotagSearch, $geotagResult, $retVal);

    # grepの実行結果が正常でない場合にエラーを出す
    if (!$is_success) {
      throw new Exception("画像ID:" . $image_id . "の情報を取得中に例外が発生しました");
    }

    # 空白文字の削除
    # テキストをカンマ区切りで配列に変換する
    # 形式は"timestamp,lat,lon,url"
    $data = explode(",", $geotagResult[0], 5);
    $timestamp = str_replace("\"", "", $data[1]);
    $lat = floatval($data[2]);
    $lon = floatval($data[3]);
    $url = $data[4];

    # 辞書構造の作成
    $geotag_info = array("lat" => $lat, "lon" => $lon, "date" => $timestamp, "url" => $url);
    # 戻り値となる変数に結果を結合する
    array_push($geotag_info_list, $geotag_info);

    # execは出力先の配列がからでない時既存の配列に結合するので空にしておく必要がある
    unset($geotagResult);

  }

  return $geotag_info_list;
}

function print_json($json)
{
  header("Content-Type: application/json; charset=utf-8");
  echo $json;
}

$tag = $_REQUEST["tag"];
$geotag_result = getGeotag($tag);
$responce_dict = array("tag" => $tag, "results" => $geotag_result);
$json = json_encode($responce_dict);
print_json($json)

  ?>

