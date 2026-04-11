package com.booklog.booklog_backend.Controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.web.client.RestClientException;

@RestController
public class ImageProxyController {
    @GetMapping("/api/proxy-image")
    public ResponseEntity<byte[]> proxyImage(@RequestParam("url") String imageUrl) {
        RestTemplate restTemplate = new RestTemplate();
        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                imageUrl,
                HttpMethod.GET,
                new HttpEntity<>(new HttpHeaders()),
                byte[].class
            );
            HttpHeaders headers = new HttpHeaders();
            MediaType contentType = response.getHeaders().getContentType();
            if (contentType != null) {
                headers.setContentType(contentType);
            } else {
                headers.setContentType(MediaType.IMAGE_JPEG);
            }
            return new ResponseEntity<>(response.getBody(), headers, HttpStatus.OK);
        } catch (RestClientException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(null);
        }
    }
}
