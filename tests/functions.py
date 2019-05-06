def assert_fields_in_object(fields, obj):
    for field in fields:
        assert field in obj
