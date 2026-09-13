import urllib.request

urls = [
    ("https://lh3.googleusercontent.com/aida/AP1WRLs9bpxX0Voor9Zv8y44ZGpAVlgdut6kbb5tjErM7sa7WnXBBo2oIqQMbFP_OxkDaZiT3d3Cx2mQPI4Bml711L48rX7MW0fm9rgrdORf9Z5o9pSUVkRTBhUo5mKGkGAuG7oM1_9sKp_EgmLJCcRCIkpdB3PkM7VGUQmT9nPgYKwlYBnxSJqSYhKdH87fTUNFyCIzeJorMmGvfuR7btkh7hdqVSdVc7zAASXuF6nV-uQCdk8uiUE4e9Ok-Qj9", "LatticeLink_Landing_Page.png"),
    ("https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzY4ZTZhMWI5YjY4ODQxYzVhOTA0MDZlYjgxMTUzOWU0EgsSBxD71a-omh8YAZIBJAoKcHJvamVjdF9pZBIWQhQxNTgwNDkxNjIzNzg3MjkzNTcwNw&filename=&opi=89354086", "LatticeLink_Landing_Page.html")
]

print("Downloading files...")
for url, filename in urls:
    try:
        print(f"Downloading {filename}...")
        urllib.request.urlretrieve(url, filename)
        print(f"Successfully downloaded {filename}")
    except Exception as e:
        print(f"Failed to download {filename}: {e}")

print("Done!")
