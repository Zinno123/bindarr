package com.bindarr.nativedetector;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import org.json.JSONObject;
import org.json.JSONArray;
import java.net.URL;
import java.net.HttpURLConnection;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.nio.charset.StandardCharsets;
import java.util.zip.GZIPInputStream;

// A read-only, explicitly requested catalog download. The token is never
// written to disk, logged, or forwarded to the signed download URL.
final class YgoCatalogLinks {
    private static final String BASE = "https://public-api.cardnexus.com/v1";
    private static HttpURLConnection open(String address, String key) throws Exception {
        URL url = new URL(address);
        if (!"https".equals(url.getProtocol())) throw new Exception("HTTPS required");
        if (key != null && !"public-api.cardnexus.com".equals(url.getHost())) throw new Exception("Invalid API host");
        HttpURLConnection conn = (HttpURLConnection)url.openConnection();
        conn.setInstanceFollowRedirects(false);
        conn.setConnectTimeout(20000);
        conn.setReadTimeout(90000);
        if (key != null) conn.setRequestProperty("Authorization", "Bearer " + key);
        int status = conn.getResponseCode();
        if (status != 200) { conn.disconnect(); throw new Exception("Catalogue HTTP " + status); }
        return conn;
    }
    private static String readJson(String url, String key) throws Exception {
        HttpURLConnection conn = open(url, key);
        try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            StringBuilder text = new StringBuilder();
            String line;
            while ((line=br.readLine())!=null) {
                text.append(line);
                if (text.length()>2000000) throw new Exception("Catalogue metadata too large");
            }
            return text.toString();
        } finally { conn.disconnect(); }
    }
    private static String gameId(String key) throws Exception {
        String raw=readJson(BASE+"/games",key).trim();
        JSONArray games;
        if (raw.startsWith("[")) games=new JSONArray(raw);
        else {
            JSONObject json=new JSONObject(raw);
            games=json.optJSONArray("data");
            if(games==null) games=json.optJSONArray("games");
        }
        if(games==null) throw new Exception("Could not read CardNexus games");
        for(int i=0;i<games.length();i++){
            JSONObject game=games.optJSONObject(i);
            if(game==null) continue;
            String id=game.optString("id",game.optString("slug",""));
            String name=(id+" "+game.optString("name","")).toLowerCase(java.util.Locale.ROOT).replaceAll("[^a-z0-9]","");
            if(name.contains("yugioh") && id.matches("[A-Za-z0-9_-]{1,40}")) return id;
        }
        throw new Exception("Yu-Gi-Oh catalogue not available for this key");
    }
    private static JSONArray ids(JSONArray rows) throws Exception {
        JSONArray out=new JSONArray();
        if(rows==null) return out;
        for(int i=0;i<rows.length();i++){
            JSONObject row=rows.optJSONObject(i);
            if(row==null) continue;
            Object value=row.opt("id");
            if(value instanceof Number && ((Number)value).longValue()>0) out.put(value);
        }
        return out;
    }
    static JSObject download(String key) throws Exception {
        String game=gameId(key);
        JSONObject meta=new JSONObject(readJson(BASE+"/feeds/"+game+"/catalog",key));
        String address=meta.getString("url");
        URL url=new URL(address);
        String host=url.getHost().toLowerCase(java.util.Locale.ROOT);
        if(!(host.endsWith(".amazonaws.com")||host.endsWith(".cardnexus.com")||host.equals("cardnexus.com"))) throw new Exception("Unexpected catalogue download host");
        HttpURLConnection conn=open(address,null);
        JSArray links=new JSArray();
        int count=0;
        try(InputStream input=conn.getInputStream();
            GZIPInputStream gzip=new GZIPInputStream(input);
            BufferedReader br=new BufferedReader(new InputStreamReader(gzip,StandardCharsets.UTF_8))) {
            String line;
            while((line=br.readLine())!=null){
                if(++count>300000 || line.length()>1000000) throw new Exception("Catalogue file too large");
                if(line.trim().isEmpty()) continue;
                JSONObject row=new JSONObject(line);
                if(!"card".equals(row.optString("productType"))) continue;
                JSONObject ext=row.optJSONObject("externalIds");
                if(ext==null) continue;
                JSONArray tcg=ids(ext.optJSONArray("tcgplayer")), cm=ids(ext.optJSONArray("cardmarket"));
                if(tcg.length()==0||cm.length()==0) continue;
                JSONObject link=new JSONObject();
                link.put("tcgplayer",tcg);link.put("cardmarket",cm);
                links.put(link);
            }
        } finally { conn.disconnect(); }
        if(links.length()==0) throw new Exception("No external product links found");
        JSObject result=new JSObject();
        result.put("records",links);
        result.put("count",count);
        return result;
    }
}
